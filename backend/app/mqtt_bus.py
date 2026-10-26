import hashlib
import json
import os
import threading
from uuid import uuid4

NS = hashlib.sha256((os.getenv("SUPABASE_URL") or "jengo").encode()).hexdigest()[:12]
MQTT_HOST = (os.getenv("MQTT_HOST") or "broker.emqx.io").strip()
MQTT_PORT = int(os.getenv("MQTT_PORT") or "1883")
MQTT_WS_URL = (os.getenv("MQTT_WS_URL") or "wss://broker.emqx.io:8084/mqtt").strip()

_client = None
_lock = threading.Lock()


def topic_for(user_id: str) -> str:
    return f"jengo/{NS}/user/{user_id}"


def listing_topic(listing_id: str) -> str:
    return f"jengo/{NS}/listing/{listing_id}"


def listing_prefix() -> str:
    return f"jengo/{NS}/listing/"


def session_for(user_id: str | None = None) -> dict:
    uid = str(user_id or "").strip()
    return {
        "url": MQTT_WS_URL,
        "topic": topic_for(uid) if uid else "",
        "listing_prefix": listing_prefix(),
        "client_id": f"jengo-{uid[:8] if uid else 'anon'}-{uuid4().hex[:6]}",
    }


def notify_users(user_ids: list[str], payload: dict):
    seen = set()
    for uid in user_ids:
        if not uid or uid in seen:
            continue
        seen.add(uid)
        _publish(topic_for(uid), payload)


def notify_listing(listing_id: str, payload: dict):
    if listing_id:
        _publish(listing_topic(str(listing_id)), payload)


def _get_client():
    global _client
    try:
        import paho.mqtt.client as mqtt
    except Exception:
        return None
    with _lock:
        if _client is not None:
            return _client
        try:
            cid = f"jengo-api-{uuid4().hex[:8]}"
            try:
                client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id=cid)
            except Exception:
                client = mqtt.Client(client_id=cid)
            client.connect(MQTT_HOST, MQTT_PORT, 30)
            client.loop_start()
            _client = client
        except Exception:
            return None
        return _client


def _publish(topic: str, payload: dict):
    def run():
        client = _get_client()
        if not client:
            return
        try:
            client.publish(topic, json.dumps(payload), qos=0)
        except Exception:
            pass

    threading.Thread(target=run, daemon=True).start()
