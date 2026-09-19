def by_app_type(manifests, app_type):
    return [m for m in manifests if m.get("appType") == app_type]

def by_stack(manifests, stack):
    return [m for m in manifests if m.get("stack") == stack]
