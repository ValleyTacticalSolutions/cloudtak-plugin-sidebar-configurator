import type { PluginAPI } from '@tak-ps/cloudtak';
import { hostStore } from './host.ts';
import { fetchConfig } from './api.ts';
import { disableForcedLock, enableForcedLock } from './lock.ts';
import type { MenuPref, SidebarConfig } from './constants.ts';

type MenuManagerLike = {
  preferenceOrder: { value: MenuPref[] };
  setOrder: (keys: string[]) => Promise<void>;
  setVisibility: (key: string, visible: 'full' | 'partial' | 'hidden') => Promise<void>;
};

async function isSystemAdmin(api: PluginAPI): Promise<boolean> {
  try {
    return !!(await api.profile.get('system_admin'));
  } catch {
    return false;
  }
}

function isEmptyOrder(order: unknown): boolean {
  return !Array.isArray(order) || order.length === 0;
}

async function writeLayout(menu: MenuManagerLike, layout: MenuPref[]): Promise<void> {
  if (!layout.length) return;
  const next = layout.map((p) => ({
    key: p.key,
    visibility: (p.visibility || 'full') as MenuPref['visibility'],
  }));
  // setOrder keeps each key's visibility from preferenceOrder and saves to the local cache and the server
  menu.preferenceOrder.value = next;
  await menu.setOrder(next.map((p) => p.key));
}

export async function applySidebarConfig(api: PluginAPI): Promise<SidebarConfig> {
  // Always clear a previous Forced lock before re-evaluating.
  disableForcedLock(api);

  const config = await fetchConfig();
  const admin = await isSystemAdmin(api);

  let menu: MenuManagerLike;
  try {
    menu = hostStore<{ menu: MenuManagerLike }>('cloudtak', api.pinia).menu;
  } catch (err) {
    console.warn('[sidebar-config] menu not ready', err);
    return config;
  }
  if (!menu) return config;

  // Off: leave every user's sidebar alone.
  if (config.mode === 'off') {
    return config;
  }

  // System admins: never touch their sidebar unless manageAdminSidebar is on.
  if (admin && !config.manageAdminSidebar) {
    return config;
  }

  const layout = admin ? config.adminItems : config.userItems;
  const currentOrder = menu.preferenceOrder?.value;

  if (config.mode === 'forced' && !admin) {
    if (layout.length) {
      await writeLayout(menu, layout);
      enableForcedLock(api, layout);
    }
    return config;
  }

  // Soft (and Forced admins when manageAdminSidebar): seed only when empty.
  if (layout.length && isEmptyOrder(currentOrder)) {
    await writeLayout(menu, layout);
  }

  return config;
}

export async function teardownSidebarConfig(api: PluginAPI): Promise<void> {
  disableForcedLock(api);
}
