def by_app_name(manifests):
    indexed = {}
    for manifest in manifests:
        app_name = manifest.get("appName")
        if app_name:
            indexed[app_name] = manifest
    return indexed
