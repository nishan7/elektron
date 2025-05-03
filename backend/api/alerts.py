from typing import List, Optional

from api.base import BaseCRUDAPI
from models.models import Device, Alert


class AlertsAPI(BaseCRUDAPI[Alert]):
    def __init__(self):
        super().__init__(Alert, "records")

