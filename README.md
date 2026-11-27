# Sidebar Configurator

CloudTAK plugin that lets a **system admin** set the default main-menu (sidebar) layout for everyone on the server — including installed plugins that register menu items.

**Minimum CloudTAK: v14.4.1**. Built and verified against CloudTAK v14.4.1 (commit 184ecb2, 2026-11-27). There is no upper limit, and newer CloudTAK versions are expected to work. Please report breakage as an issue.

## What it does

- **Admin-only menu entry** — “Sidebar Configurator” appears only for CloudTAK system admins (`requiresSystemAdmin`).
- **Two layouts**
  - **Standard users** — applied to non-admins
  - **Admins** — optional; **off by default** so system admin sidebars are never touched. Enable “Manage Admin Sidebars” to seed admins, and use **Copy From Standard Users** to start from the standard layout.
- **Order + visibility** for each item: eye = visible, eye-off = hidden (hidden items sort to the bottom of the configurator list)
- **Apply modes** (listed Off → New Users Only → Forced)
  - **Off (default on install / until a layout is saved)** — do not change anyone’s sidebar.
  - **New Users Only** — apply the matching layout only when that user’s `menu_order` is empty. Users can customize afterward and are not overwritten.
  - **Forced** — non-admins always get the Standard Users layout and cannot change order/visibility. **System admins are exempt** and keep their own bars.
- **Autosave** — mode, layouts, and admin options persist automatically after each change.
- **Overwrite All Toolbars** (with confirm) force-overwrites `menu::order` for all non-admin users — even when mode is New Users Only. System admins are skipped unless “Manage Admin Sidebars” is on. Off mode still no-ops. If push cannot list profiles, clients still apply on the next load.

## Install

Do not rely on `WEB_PLUGINS` alone — the shared config API must be installed too:

```bash
git clone https://github.com/ValleyTacticalSolutions/cloudtak-plugin-sidebar-configurator.git
cd cloudtak-plugin-sidebar-configurator
./install.sh
```

Or pass the CloudTAK path:

```bash
./install.sh /path/to/CloudTAK
```

The script finds CloudTAK at `$CLOUDTAK`, `~/CloudTAK`, `/home/takwerx/CloudTAK`, or `/home/*/CloudTAK`. It copies into `app/plugins/sidebar-configurator/` and `api/stateless/routes/plugin-sidebar-config.ts`, then rebuilds the API image.

After it finishes: **Settings → Refresh App**. A normal browser refresh is not enough.

```bash
./install.sh --remove
```

### Local development

Symlink this checkout to `CloudTAK/app/plugins/sidebar-configurator`, copy or symlink `server/plugin-sidebar-config.ts` into `api/stateless/routes/`, run `npm install` here (with `@tak-ps/cloudtak` pointing at your CloudTAK `app` package), and restart `npm run serve` in `app`.

## Mobile (CloudTAK iOS/Android app)

The native apps only run runtime bundles, not plugins compiled into the web build. The bundle covers the web half only, so **the server-side install is still required**: run `./install.sh` (or the Marketplace install) so the `/api/sidebar-config` route is on the CloudTAK server and the API image is rebuilt.

1. Build: `npm install && npm run bundle` creates `release/sidebar-configurator-<version>.tar.gz` (`manifest.json` + `index.js`). GitHub releases carry the same file.
2. Upload (CloudTAK admin): `POST /api/plugin/bundle` with the tar.gz.
3. On the phone: **Settings → Plugins**, then load Sidebar Configurator. It is stored on the device and loads offline.

The saved layout is applied to the same menu store the phone's bottom-sheet menu reads, and drag-to-reorder works by touch (press the grip handle briefly, then drag). The bundle contains everything except `vue`, `vue-router` and `@tak-ps/vue-tabler`, which the app provides.

## How to use

1. Sign in as a CloudTAK **system admin**.
2. Open **Sidebar Configurator** from the right-side menu.
3. Choose **Off**, **New Users Only**, or **Forced** (Off is first and is the default until you save a layout).
4. Edit **Standard users** and **Admins** tabs (drag to reorder; eye toggle to show/hide).
5. Optionally click **Use my current sidebar** to seed a tab from your live menu.
6. Changes autosave. Use **Overwrite All Toolbars** if you want existing users updated immediately (no effect while Off).

## Notes

- Forced lock of the pencil/reorder UI is best-effort (CSS + client method wrap) and only affects non-admins.
- New plugin menu keys that appear after a layout was saved append at the end until an admin re-saves.
- The configurator button itself is admin-only; New Users Only / Forced apply still runs for every user on plugin `enable()` when that mode is active.

## Core imports

None. The plugin no longer imports anything from CloudTAK's `src/`, so it also works as a runtime bundle:

- `lib/host.ts` resolves the CloudTAK server URL and token and makes authenticated requests (`apiFetch`, used for `/api/sidebar-config`), and reads host Pinia stores from `api.pinia` (`hostStore('cloudtak')` for the menu).
- `lib/vendor/MenuTemplate.vue` is a copy of CloudTAK's menu frame. Re-sync it when CloudTAK changes the menu chrome.
- The admin check uses `api.profile`; saving a layout calls the host menu's `setOrder`.

## Development

The Marketplace install compiles the plugin inside CloudTAK. To check it against the latest CloudTAK `main` (ESLint, `vue-tsc`, Vite build, API lint and `tsc`):

```bash
bash verify-cloudtak.sh . sidebar-configurator
```

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).
