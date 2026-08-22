import sys
import types
import unittest


fastapi = types.ModuleType("fastapi")


class DummyAPIRouter:
    def get(self, *args, **kwargs):
        def decorator(func):
            return func

        return decorator


class DummyHTTPException(Exception):
    pass


fastapi.APIRouter = DummyAPIRouter
fastapi.Query = lambda *args, **kwargs: None
fastapi.HTTPException = DummyHTTPException
sys.modules.setdefault("fastapi", fastapi)

pydantic = types.ModuleType("pydantic")


class DummyBaseModel:
    pass


pydantic.BaseModel = DummyBaseModel
sys.modules.setdefault("pydantic", pydantic)

services = types.ModuleType("services")
services.get_last_n_trading_days_ohlc = lambda *args, **kwargs: None
sys.modules.setdefault("services", services)

numpy = types.ModuleType("numpy")
numpy.mean = lambda values: sum(values) / len(values)
numpy.std = lambda values: 0
sys.modules.setdefault("numpy", numpy)

from endpoints.standard_deviation import round_to_nearest_0_05


class RoundToNearest005Tests(unittest.TestCase):
    def test_rounds_prices_to_nearest_0_05(self):
        test_cases = [
            (100.00, 100.00),
            (100.02, 100.00),
            (100.03, 100.05),
            (100.07, 100.05),
            (100.08, 100.10),
            (123.456, 123.45),
        ]

        for value, expected in test_cases:
            with self.subTest(value=value):
                self.assertEqual(round_to_nearest_0_05(value), expected)


if __name__ == "__main__":
    unittest.main()
