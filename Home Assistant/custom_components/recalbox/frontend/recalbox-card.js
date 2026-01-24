class RecalboxCard extends HTMLElement {
  set hass(hass) {
    const entityId = this.config.entity;
    const state = hass.states[entityId];

    if (!state) {
      this.innerHTML = `<ha-card><div style="padding:16px; color:red;">Entité non trouvée : ${entityId}</div></ha-card>`;
      return;
    }

    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <style>
            .recalbox-card-content { padding: 16px; }
            .info-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--divider-color); }
            .info-row:last-of-type { border-bottom: none; }
            .info-row ha-icon { color: var(--icon-primary-color); margin-right: 16px; color: var(--paper-item-icon-color); }
            .info-text { flex-grow: 1; }
            .info-value { color: var(--secondary-text-color); font-size: 0.9em; }
            .status-badge { background: var(--disabled-text-color); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; float: right; }
            .status-on { background: var(--success-color); }

            .game-preview { text-align: center; padding: 10px 0; background-color: var(--secondary-background-color); margin: 10px -16px; }
            .game-preview img { max-width: 90%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }

            .card-actions { display: flex; justify-content: space-evenly; padding: 12px; background-color: var(--secondary-background-color); border-top: 1px solid var(--divider-color); }
            .action-button { display: flex; flex-direction: row; gap: 6px; border-radius: 20px; padding: 2px 12px; align-items: center; cursor: pointer; font-size: 10px; text-transform: uppercase; color: var(--primary-text-color); }
            .action-button ha-icon { color: var(--icon-primary-color); margin-bottom: 4px; --mdc-icon-size: 18px; }

            .card-markdown-footer { padding: 8px 16px; border-top: 1px solid var(--divider-color); font-size: 0.8em; color: var(--secondary-text-color); line-height: 1.4; }
            .card-markdown-footer hr { border: 0; border-top: 1px solid var(--divider-color); margin: 8px 0; }
            .card-markdown-footer a { color: var(--primary-color); text-decoration: none; font-weight: bold; }

            .footer { margin: 12px 0px; }
          </style>
          <div id="container"></div>
          <div id="actions-area" class="card-actions"></div>
          <div id="markdown-footer" class="card-markdown-footer"></div>
        </ha-card>
      `;
      this.content = this.querySelector('#container');
      this.actions = this.querySelector('#actions-area');
      this.footer = this.querySelector('#markdown-footer');
    }

    const isOn = state.state === "on";
    const game = state.attributes.game || "-";
    const consoleName = state.attributes.console || "-";
    const genre = state.attributes.genre || "-";
    const imageUrl = state.attributes.imageUrl || "";

    // 1. Infos principales
    this.content.innerHTML = `
      <div class="recalbox-card-content">
        <div class="info-row">
          <ha-icon icon="mdi:gamepad-variant-outline"></ha-icon>
          <div class="info-text"><div>${this.config.title || "Recalbox"}</div><div class="info-value">Système de jeu</div></div>
          <span class="status-badge ${isOn ? 'status-on' : ''}">${state.state.toUpperCase()}</span>
        </div>
        ${isOn ? `
          <div class="info-row"><ha-icon icon="mdi:sony-playstation"></ha-icon><div class="info-text"><div>${consoleName}</div><div class="info-value">Console</div></div></div>
          <div class="info-row"><ha-icon icon="mdi:gamepad-variant-outline"></ha-icon><div class="info-text"><div>${game}</div><div class="info-value">Jeu</div></div></div>
          <div class="info-row"><ha-icon icon="mdi:folder-outline"></ha-icon><div class="info-text"><div>${genre}</div><div class="info-value">Genre</div></div></div>
          ${imageUrl && imageUrl.length > 5 ? `<div class="game-preview"><img src="${imageUrl}"></div>` : ''}
        ` : ''}
      </div>
    `;

    // 2. Boutons d'actions
    if (isOn) {
      this.actions.style.display = "flex";
      this.actions.innerHTML = `
        <div class="action-button" id="btn-stop"><ha-icon icon="mdi:power"></ha-icon>Turn Off</div>
        <div class="action-button" id="btn-reboot"><ha-icon icon="mdi:restart"></ha-icon>Reboot</div>
        <div class="action-button" id="btn-snap"><ha-icon icon="mdi:camera"></ha-icon>Screenshot</div>
      `;
      this.actions.querySelector('#btn-stop').onclick = () => hass.callService('button', 'press', { entity_id: this.config.shutdown_button });
      this.actions.querySelector('#btn-reboot').onclick = () => hass.callService('button', 'press', { entity_id: this.config.reboot_button });
      this.actions.querySelector('#btn-snap').onclick = () => hass.callService('button', 'press', { entity_id: this.config.screenshot_button });
    } else {
      this.actions.style.display = "none";
    }

    // 3. Markdown Footer (Hardware & Links)
    // On essaie de récupérer les infos du device via le registry de HA
    const deviceId = state.context && state.context.device_id;
    const sw_version = state.attributes.sw_version || "x.x"; // On peut aussi le passer via attributes
    const host = this.config.host || "recalbox.local";

    this.footer.innerHTML = `
      <div class="footer">
        Recalbox (${host}) version ${sw_version}
        <br>
        <a href="http://${host}:81" target="_blank">Recalbox WebManager</a> |
        <a href="https://www.recalbox.com" target="_blank">Recalbox.com</a> |
        <a href="https://github.com/tototo23/RecalboxHomeAssistant" target="_blank">GitHub intégration</a>
      </div>
    `;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Entité manquante");
    this.config = config;
  }

  getCardSize() { return 6; }
}

customElements.define('recalbox-card', RecalboxCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "recalbox-card",
  name: "Recalbox Card",
  description: "Carte complète avec gestion des jeux, actions et informations système."
});