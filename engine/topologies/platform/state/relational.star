load("../../tilt/resources/infra-loader.star", _Infra = "Infra")

def load(should_enable):
    return _Infra.load_database(should_enable)
