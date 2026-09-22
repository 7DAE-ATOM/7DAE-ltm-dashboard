"use client";

import { useEffect, useRef } from "react";

export type NodeContextMenuTarget = {
  nodeId: string;
  x: number;
  y: number;
  variant: "bench" | "shared-resource";
  dependsOnCount: number;
  supportsCount: number;
  sharedResourcesCount: number;
  usableByCount: number;
};

type Props = {
  target: NodeContextMenuTarget | null;
  onExpandDependsOn: (nodeId: string) => void;
  onExpandSupports: (nodeId: string) => void;
  onExpandSharedResources: (nodeId: string) => void;
  onUsableBy: (nodeId: string) => void;
  onHide: (nodeId: string) => void;
  onClose: () => void;
};

function menuItemClass(enabled: boolean) {
  return `flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-sm rounded cursor-default ${
    enabled ? "text-fg hover:bg-surface-2" : "text-muted opacity-60"
  }`;
}

function MenuItem({
  label,
  count,
  onClick,
}: Readonly<{
  label: string;
  count: number;
  onClick: () => void;
}>) {
  const enabled = count > 0;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={!enabled}
      onClick={onClick}
      className={menuItemClass(enabled)}
    >
      <span>{label}</span>
      <span className="font-mono text-xs">{count}</span>
    </button>
  );
}

export default function NodeContextMenu({
  target,
  onExpandDependsOn,
  onExpandSupports,
  onExpandSharedResources,
  onUsableBy,
  onHide,
  onClose,
}: Readonly<Props>) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute z-30 min-w-[200px] rounded-card border border-border bg-surface py-1.5 shadow-2xl"
      style={{ left: target.x, top: target.y }}
    >
      {target.variant === "bench" ? (
        <>
          <MenuItem
            label="Show depends on"
            count={target.dependsOnCount}
            onClick={() => {
              onExpandDependsOn(target.nodeId);
              onClose();
            }}
          />
          <MenuItem
            label="Show supports"
            count={target.supportsCount}
            onClick={() => {
              onExpandSupports(target.nodeId);
              onClose();
            }}
          />
          <MenuItem
            label="Show shared resources"
            count={target.sharedResourcesCount}
            onClick={() => {
              onExpandSharedResources(target.nodeId);
              onClose();
            }}
          />
        </>
      ) : (
        <MenuItem
          label="Usable by"
          count={target.usableByCount}
          onClick={() => {
            onUsableBy(target.nodeId);
            onClose();
          }}
        />
      )}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onHide(target.nodeId);
          onClose();
        }}
        className={menuItemClass(true)}
      >
        <span>Hide</span>
      </button>
    </div>
  );
}
