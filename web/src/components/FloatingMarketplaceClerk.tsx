"use client";

import { Button } from "@appica/ui-react/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@appica/ui-react/collapsible";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@appica/ui-react/drawer";
import { useMediaQuery } from "@appica/ui-react/hooks/use-media-query";
import {
  GripHorizontal,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { InterfaceLocale } from "../lib/preferences";

interface FloatingMarketplaceClerkProps {
  open: boolean;
  locale: InterfaceLocale;
  onOpenChange: (open: boolean) => void;
  launcherLabel?: string;
  children: ReactNode;
}

const VIEWPORT_GUTTER = 16;
const COLLAPSED_HEIGHT = 68;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 560;

function desktopPanelStyle(collapsed: boolean): CSSProperties {
  if (typeof window === "undefined") {
    return {
      position: "fixed",
      right: 24,
      bottom: 24,
      width: DEFAULT_WIDTH,
      height: collapsed ? COLLAPSED_HEIGHT : DEFAULT_HEIGHT,
    };
  }
  const width = Math.min(DEFAULT_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
  const height = Math.min(
    collapsed ? COLLAPSED_HEIGHT : DEFAULT_HEIGHT,
    window.innerHeight - VIEWPORT_GUTTER * 2,
  );
  return {
    position: "fixed",
    right: 24,
    bottom: 24,
    width,
    height,
  };
}

export function FloatingMarketplaceClerk({
  open,
  locale,
  onOpenChange,
  launcherLabel,
  children,
}: FloatingMarketplaceClerkProps) {
  const isDesktop = useMediaQuery("(min-width: 48rem)");
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const isZh = locale === "zh";
  const defaultLauncher = isZh ? "帮我找" : "Find items";
  const launcherText = launcherLabel ?? defaultLauncher;
  const launcherAria =
    launcherLabel ?? (isZh ? "打开找商品" : "Open product search");

  useEffect(() => {
    setPortalNode(document.body);
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDesktop, onOpenChange, open]);

  const showClerk = () => {
    setCollapsed(false);
    onOpenChange(true);
  };

  const launcher = portalNode
    ? createPortal(
        <Button
          className={`root-marketplace-clerk-toggle${open ? " is-hidden" : ""}`}
          type="button"
          aria-controls="marketplace-clerk-panel"
          aria-expanded={open}
          aria-label={launcherAria}
          onClick={showClerk}
        >
          <Search aria-hidden="true" />
          <span>{launcherText}</span>
        </Button>,
        portalNode,
      )
    : null;

  if (!portalNode) return null;

  if (!isDesktop) {
    return (
      <>
        {launcher}
        <Drawer
          side="bottom"
          modal={false}
          open={open}
          onOpenChange={onOpenChange}
        >
          <DrawerContent
            className="mobile-clerk-drawer"
            closeButton={false}
            frame={false}
            backdrop
          >
            <DrawerHeader className="mobile-clerk-drawer-header">
              <div>
                <DrawerTitle>
                  {isZh ? "找商品" : "Find products"}
                </DrawerTitle>
                <DrawerDescription>
                  {isZh
                    ? "填写预算、用途或偏好。"
                    : "Enter your budget, use case, or preferences."}
                </DrawerDescription>
              </div>
              <DrawerClose
                render={
                  <Button
                    className="floating-clerk-action"
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    aria-label={isZh ? "关闭" : "Close"}
                  >
                    <X aria-hidden="true" />
                  </Button>
                }
              />
            </DrawerHeader>
            <DrawerBody
              className="mobile-clerk-drawer-body"
              id="marketplace-clerk-panel"
            >
              {children}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {launcher}
      {createPortal(
        <div className="floating-clerk-viewport" aria-hidden={!open}>
          <div
            className={`floating-clerk-rnd${open ? " is-open" : " is-stowed"}`}
            style={desktopPanelStyle(collapsed)}
          >
            <Collapsible
              className="floating-clerk-window"
              open={!collapsed}
              onOpenChange={(expanded) => setCollapsed(!expanded)}
            >
              <header className="floating-clerk-drag-handle">
                <GripHorizontal
                  className="floating-clerk-grip"
                  aria-hidden="true"
                />
                <div>
                  <strong>{isZh ? "找商品" : "Find products"}</strong>
                  <span>
                    {collapsed
                      ? isZh
                        ? "已收起，拖动标题栏或展开继续"
                        : "Stowed — drag or expand to continue"
                      : isZh
                        ? "可拖动、缩放和收起"
                        : "Move, resize, or stow this panel"}
                  </span>
                </div>
                <CollapsibleTrigger
                  render={
                    <Button
                      className="floating-clerk-action"
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      aria-label={
                        collapsed
                          ? isZh
                            ? "展开"
                            : "Expand"
                          : isZh
                            ? "收起"
                            : "Stow"
                      }
                    >
                      {collapsed ? (
                        <Maximize2 aria-hidden="true" />
                      ) : (
                        <Minimize2 aria-hidden="true" />
                      )}
                    </Button>
                  }
                />
                <Button
                  className="floating-clerk-action"
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  aria-label={isZh ? "关闭" : "Close"}
                  onClick={() => onOpenChange(false)}
                >
                  <X aria-hidden="true" />
                </Button>
              </header>
              <CollapsibleContent
                className="floating-clerk-content"
                id="marketplace-clerk-panel"
              >
                {children}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>,
        portalNode,
      )}
    </>
  );
}
