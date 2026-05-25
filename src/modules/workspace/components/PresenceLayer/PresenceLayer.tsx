import { MousePointer2 } from 'lucide-react';
import { useWorkspaceSelector } from '../../state';

/** Lightweight collaboration facade that renders deterministic fake cursors and user presence. */
export function PresenceLayer() {
  const presence = useWorkspaceSelector((store) => store.presence);

  return (
    <aside className="presence-layer" aria-label="Collaborator presence">
      <div className="presence-avatars">
        {presence.map((user) => (
          <div key={user.id} className="presence-user" title={`${user.name} is viewing the grid`}>
            <span className="avatar" style={{ backgroundColor: user.color }}>
              {user.name.slice(0, 1)}
            </span>
            <span>{user.name}</span>
          </div>
        ))}
      </div>
      <div className="presence-cursors" aria-label="Live cursors">
        {presence.map((user) => (
          <div key={user.id} className="presence-cursor" style={{ color: user.color }}>
            <MousePointer2 size={15} aria-hidden="true" />
            <span>
              {user.name}: {user.cursor.recordId} / {user.cursor.fieldId}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
