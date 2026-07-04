import { useEffect, useState } from "react";
import { SettingsModal } from "./SettingsModal";

/**
 * Listens for `nurovia:open-settings` and renders the settings modal at root.
 * Lets any page (or command palette, or ⌘,) open the modal without owning the state.
 */
export function GlobalSettings() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nurovia:open-settings", onOpen);
    return () => window.removeEventListener("nurovia:open-settings", onOpen);
  }, []);
  return <SettingsModal open={open} onClose={() => setOpen(false)} onChanged={() => undefined} />;
}