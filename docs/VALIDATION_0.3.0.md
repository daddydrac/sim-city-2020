# Validation — 0.3.0 (2026-09-17)

- 38 Node tests pass. All application modules pass syntax checks.
- New tests cover 49,152-parcel rectangular regions, boundary neighbors, service coverage, deterministic sparse saves, terrain preset differences, interpolation and per-stroke charging, terrain undo, 108 camera projection/depth combinations, parking, staged launch state, retained metric values, connected sample traffic routes, and terrain import validation.
- Renderer interaction test covers CSS coordinate offsets, held pointer movement, capture, release outside, cancellation, and the left-drag pan disable/rotation contract. This is not a GPU pointer-picking test.
- Browser UI checked: welcome → six-region selection → Alpine region → running city; pause; garage build via coordinate controls; garage phase/capacity inspector; traffic filter changing the displayed count/mean; snapshot selection; animation toggle; native kepler map export; underground pipe selection and construction settings.
- Vendor checksums remain unchanged and match the manifest.
- Example CPU timings for a 49,152-parcel starter region: analysis ~127 ms, monthly tick ~172 ms; compact starter save ~270 KB. These are development-machine samples, not performance guarantees or GPU frame rates.

## Not validated here

Cloud Chrome reports WebGL unavailable, so actual meshes, shaders, shadows, GPU picking, drag gestures against rendered terrain, camera motion, launch appearance, custom GLB materials and I3S tile rendering remain unverified. Docker execution is unavailable in this environment. The architectural-reference photorealism target remains open. See VISUAL_SPECIFICATION.md for local acceptance.
