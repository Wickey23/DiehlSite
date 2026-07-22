# 3D model handoff

Place new GLB files in the matching folder, then assign their final public path in
the site’s 3D Admin model library. Do not overwrite an existing model unless it is
the same verified asset and revision.

Required modular structure:

- `isuzu/chassis/` — NPR, NPR-HD, NPR-XD, NQR, NRR, NRR EV, FTR and FVR cab/chassis assets
- `isuzu/interiors/` — model/cab-specific interiors
- `isuzu/bodies/` — shared dry van, reefer, stake, flatbed, dump, utility, rollback, hooklift and crane bodies
- `isuzu/accessories/` — toolboxes, doors, liftgates, racks, lights, plows and other independently mountable parts
- equivalent folders under `freightliner/` and `western-star/`

For adjustable wheelbases, export the rear axle and stretchable frame section as
separately named nodes. For adjustable body lengths, provide either size-specific
GLBs or a documented stretch-safe section. One-piece models are accepted only as
reference visuals and are never treated as exact adjustable geometry.
