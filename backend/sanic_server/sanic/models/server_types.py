from types import SimpleNamespace

from ...sanic.models.protocol_types import TransportProtocol


class Signal:
    stopped = False


class ConnInfo:
    """
    Local and remote addresses and SSL status info.
    """

    __slots__ = (
        "client_port",
        "client",
        "client_ip",
        "ctx",
        "peername",
        "server_port",
        "server",
        "sockname",
        "ssl",
    )

    def __init__(self, transport: TransportProtocol, unix=None):
        self.ctx = SimpleNamespace()
        self.peername = None
        self.server = self.client = ""
        self.server_port = self.client_port = 0
        self.client_ip = ""
        self.sockname = addr = transport.get_extra_info("sockname")
        self.ssl: bool = bool(transport.get_extra_info("sslcontext"))

        if isinstance(addr, str):  # UNIX socket
            self.server = unix or addr
            return

        # IPv4 (ip, port) or IPv6 (ip, port, flowinfo, scopeid)
        if isinstance(addr, tuple):
            self.server = addr[0] if len(addr) == 2 else f"[{addr[0]}]"
            self.server_port = addr[1]
            # self.server gets non-standard port appended
            if addr[1] != (443 if self.ssl else 80):
                self.server = f"{self.server}:{addr[1]}"
        self.peername = addr = transport.get_extra_info("peername")

        if isinstance(addr, tuple):
            self.client = addr[0] if len(addr) == 2 else f"[{addr[0]}]"
            self.client_ip = addr[0]
            self.client_port = addr[1]
