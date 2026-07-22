import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishedAsset = {
  id: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  kind: "exterior" | "interior" | "body" | "complete";
  variant: string;
  status: "reference" | "exact";
  compatibility: "verified" | "review" | "incompatible" | "not-applicable";
  file: string;
  paintMaterials?: string;
  nominalLengthFt?: number;
  bodySizingMode?: "locked" | "uniform-reference" | "stretch-zones-verified";
  note: string;
  publishedAt?: string;
  commitSha?: string;
};

const apiHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json"
});

function safePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "model";
}

async function githubJson(url: string, token: string, init?: RequestInit) {
  const headers = new Headers(apiHeaders(token));
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `GitHub returned ${response.status}`);
  return payload;
}

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || "Wickey23/DiehlSite";
  const branch = process.env.GITHUB_BRANCH || "main";
  const publishKey = process.env.MODEL_PUBLISH_KEY;
  if (!token || !publishKey) return NextResponse.json({ error: "Permanent model publishing is not configured on this deployment." }, { status: 503 });
  if (request.headers.get("x-model-publish-key") !== publishKey) return NextResponse.json({ error: "The publisher key is incorrect." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const rawAsset = form.get("asset");
    if (!(file instanceof File) || typeof rawAsset !== "string") return NextResponse.json({ error: "A GLB file and model destination are required." }, { status: 400 });
    if (file.size > 95 * 1024 * 1024) return NextResponse.json({ error: "GitHub rejects files over 100 MB. Optimize this GLB or publish it with Git LFS." }, { status: 413 });

    const asset = JSON.parse(rawAsset) as PublishedAsset;
    if (!asset.id || !asset.brandId || !asset.modelId || !["exterior", "interior", "body", "complete"].includes(asset.kind)) return NextResponse.json({ error: "The selected model destination is invalid." }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length < 12 || bytes.subarray(0, 4).toString("utf8") !== "glTF") return NextResponse.json({ error: "This is not a valid binary GLB file." }, { status: 400 });
    if (bytes.readUInt32LE(8) !== bytes.length) return NextResponse.json({ error: "The GLB is incomplete and cannot be published." }, { status: 400 });

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) throw new Error("GITHUB_REPOSITORY must use owner/repository format.");
    const root = `https://api.github.com/repos/${owner}/${repo}`;
    const ref = await githubJson(`${root}/git/ref/heads/${encodeURIComponent(branch)}`, token);
    const parentSha = ref.object.sha as string;
    const parentCommit = await githubJson(`${root}/git/commits/${parentSha}`, token);
    const baseTree = parentCommit.tree.sha as string;

    const fileName = `${safePart(asset.brandId)}-${safePart(asset.modelId)}-${safePart(asset.kind)}-${safePart(asset.variant)}.glb`;
    const repositoryPath = `public/models/uploads/${fileName}`;
    const publicPath = `/models/uploads/${fileName}`;
    const glbBlob = await githubJson(`${root}/git/blobs`, token, { method: "POST", body: JSON.stringify({ content: bytes.toString("base64"), encoding: "base64" }) });

    let publishedAssets: PublishedAsset[] = [];
    const registryPath = "public/models/registry-overrides.json";
    const registryResponse = await fetch(`${root}/contents/${registryPath}?ref=${encodeURIComponent(branch)}`, { headers: apiHeaders(token), cache: "no-store" });
    if (registryResponse.ok) {
      const existing = await registryResponse.json();
      publishedAssets = JSON.parse(Buffer.from(existing.content, "base64").toString("utf8"));
      if (!Array.isArray(publishedAssets)) publishedAssets = [];
    } else if (registryResponse.status !== 404) {
      const error = await registryResponse.json().catch(() => ({}));
      throw new Error(error?.message || "Could not read the published model registry.");
    }

    const publishedAt = new Date().toISOString();
    const durableAsset: PublishedAsset = { ...asset, file: publicPath, status: asset.status === "exact" ? "exact" : "reference", note: `Published to GitHub from 3D Admin on ${publishedAt}. ${asset.note || "Dealer verification still required."}`, publishedAt };
    publishedAssets = [...publishedAssets.filter((item) => item.id !== asset.id), durableAsset].sort((a, b) => a.id.localeCompare(b.id));
    const registryBlob = await githubJson(`${root}/git/blobs`, token, { method: "POST", body: JSON.stringify({ content: Buffer.from(`${JSON.stringify(publishedAssets, null, 2)}\n`).toString("base64"), encoding: "base64" }) });
    const tree = await githubJson(`${root}/git/trees`, token, { method: "POST", body: JSON.stringify({ base_tree: baseTree, tree: [{ path: repositoryPath, mode: "100644", type: "blob", sha: glbBlob.sha }, { path: registryPath, mode: "100644", type: "blob", sha: registryBlob.sha }] }) });
    const commit = await githubJson(`${root}/git/commits`, token, { method: "POST", body: JSON.stringify({ message: `models: publish ${asset.brandName} ${asset.modelName} ${asset.kind}`, tree: tree.sha, parents: [parentSha] }) });
    await githubJson(`${root}/git/refs/heads/${encodeURIComponent(branch)}`, token, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });

    return NextResponse.json({ ok: true, publicPath, commitSha: commit.sha, commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`, publishedAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The model could not be published." }, { status: 500 });
  }
}
