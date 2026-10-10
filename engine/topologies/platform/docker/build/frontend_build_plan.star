# =============================================================================
# 🏗️ TILT SDK - FRONTEND BUILD PLAN
# =============================================================================
# Decides how a frontend image runs its production build.
#
# The CLI scaffolds `"build": "tsc --noEmit && vite build"`. Running that script
# inside the image build makes the type-check block the image and compete for
# CPU with other builds. When the script has exactly that standard shape, the
# image runs `vite build` directly and the type-check becomes a separate,
# non-blocking Tilt resource. Any other script runs unchanged.
# =============================================================================

DEFAULT_FRONTEND_BUILD_CMD = 'bun run build'

# The type-check forms TDK recognises: tsc[ --noEmit][ -b].
_TSC_FORMS = ['tsc', 'tsc --noEmit', 'tsc -b', 'tsc --noEmit -b']
_VITE_BUILD = 'vite build'


def _default_plan():
    return {'build_cmd': DEFAULT_FRONTEND_BUILD_CMD, 'typecheck': False}


def frontend_build_plan(package_json_path):
    """Returns {'build_cmd': str, 'typecheck': bool} for the package.json at package_json_path.

    build_cmd is the command the image runs; the generated Vite config is appended to it.
    typecheck is True only when the standard `tsc ... && vite build` form was recognised.
    A missing or unreadable package.json, or any other script, gets the default plan.
    """
    if not os.path.exists(package_json_path):
        return _default_plan()

    scripts = read_json(package_json_path).get('scripts', {})
    script = scripts.get('build', '').strip()
    steps = script.split(' && ')
    if len(steps) != 2:
        return _default_plan()

    typecheck_step = steps[0].strip()
    vite_step = steps[1].strip()
    if typecheck_step not in _TSC_FORMS:
        return _default_plan()
    if vite_step != _VITE_BUILD and not vite_step.startswith(_VITE_BUILD + ' '):
        return _default_plan()

    extra_args = vite_step[len(_VITE_BUILD):]
    # The generated config is appended with --config, so a script that already sets one is not standard.
    if '--config' in extra_args or ' -c ' in extra_args:
        return _default_plan()

    return {'build_cmd': 'bunx vite build' + extra_args, 'typecheck': True}
