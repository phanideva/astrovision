import { useEffect, useState } from "react";
import { portalApi, PortalNotification } from "../api/portal";

export default function PortalNotifications() {
  const [rows, setRows] = useState<PortalNotification[]>([]);

  async function load() {
    const data = await portalApi.listNotifications(false);
    setRows(data.results);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function markRead(id: number) {
    await portalApi.markNotificationRead(id);
    await load();
  }

  async function markAll() {
    await portalApi.markAllNotificationsRead();
    await load();
  }

  return (
    <div>
      <div className="portal-kicker">Alert Center</div>
      <h2 className="portal-title">Inbox</h2>
      <button className="btn secondary" onClick={markAll} style={{ marginBottom: 12 }}>Mark all read</button>
      <div className="portal-list">
        {rows.map((row) => (
          <div className="portal-item" key={row.id}>
            <h4>{row.title}</h4>
            <div style={{ opacity: 0.8 }}>{row.body}</div>
            {!row.is_read && (
              <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => markRead(row.id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
