<template>
  <div>
    <v-app-bar class="app-navbar">
      <v-container fluid class="header-container">
        <div class="header-logos">
          <v-img :src="logoENC" alt="Logo ENC" class="logo logo-enc" contain
                 @click="goToWebsite('https://www.chartes.psl.eu/')"/>
          <v-tooltip :z-index="11050" location="bottom" :offset="10" content-class="header-tooltip">
            <template #activator="{ props }">
              <v-img
                  v-bind="props"
                  :src="logoSrc"
                  alt="Logo App"
                  class="logo logo-app"
                  contain
                  @click="$router.push('/home')"
              />
            </template>
            <span class="tooltip-text">Retour à l'accueil</span>
          </v-tooltip>
        </div>

        <div class="burger-wrapper d-md-none">
          <button class="hamburger" :class="{ 'is-opened': drawer }" @click="drawer = !drawer">
            <span></span>
          </button>
        </div>

        <div class="d-none d-md-flex">
              <v-btn
                  v-bind="props"
                  class="admin-btn"
                  :ripple="false"
                  @click="goToWebsite(adminUrl)"
              >
                <v-icon color="white" size="47" class="admin-icon">
                  mdi-account-circle
                </v-icon>
              </v-btn>

              <v-img
                  v-bind="props"
                  :src="logoAPI"
                  alt="API Icon"
                  class="api-btn"
                  contain
                  @click="goToWebsite(apiDocsUrl)"
              />
        </div>
      </v-container>
    </v-app-bar>

    <v-expand-transition>
      <div v-if="drawer" class="mobile-slide-menu d-md-none">
        <v-list class="mobile-popover">
          <v-list-item @click="goToWebsite(adminUrl)">
            <template #prepend>
              <v-icon class="menu-icon">mdi-account-circle</v-icon>
            </template>
            <v-list-item-title class="menu-label">Administration</v-list-item-title>
          </v-list-item>

          <v-divider class="menu-divider"/>

          <v-list-item @click="goToWebsite(apiDocsUrl)">
            <template #prepend>
              <v-img :src="logoAPI" height="24" width="24" class="menu-icon-image"/>
            </template>
            <v-list-item-title class="menu-label">Documentation d'API</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>
  </div>
</template>

<script>
import {mapState} from 'vuex';
import logoENC from '@/assets/images/logos/enc_head_logo.svg';
import logoSrc from '@/assets/images/logos/dil-icons/logo-dil-v5.svg';
import logoAPI from '@/assets/images/logos/enc_api_icon.svg';

export default {
  name: 'Header',
  data() {
    return {
      logoENC,
      logoSrc,
      logoAPI,
      drawer: false
    };
  },
  computed: {
    ...mapState(['apiDocsUrl', 'adminUrl'])
  },
  methods: {
    goToWebsite(url) {
      window.open(url, '_blank');
      if (window.innerWidth < 960) {
        this.drawer = false;
      }
    }
  }
};
</script>

<style scoped>

.app-navbar {
  background-color: var(--red-pompein) !important;
  padding: 0 !important;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2500 !important;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
}

.header-logos {
  display: flex;
  align-items: center;
}

.logo {
  cursor: pointer;
  z-index: 1;
}

.logo-enc {
  width: 90px;
  height: 50px;
  margin-left: 10px;
}

.logo-enc > * {
  padding: 0 !important;
}

.logo-app {
  width: 125px;
  height: 50px;
}

.logo:hover {
  filter: brightness(0.8);
}

.api-btn {
  background-color: var(--red-pompein);
  color: white;
  border-radius: 0.5rem;
  height: auto;
  width: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.admin-icon {
  color: white;
  cursor: pointer;
  transition: filter 0.3s ease;
}

.admin-icon:hover {
  filter: brightness(0.8);
}

.admin-btn {
  background: transparent !important;
  box-shadow: none !important;
  min-width: 45px !important;

}

.admin-btn:hover {
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.admin-btn .v-btn__overlay) {
  opacity: 0 !important;
  background: transparent !important;
}

:deep(.admin-btn .v-btn__underlay) {
  background: transparent !important;
}

.menu-icon {
  margin-right: -20px;
}

.menu-icon-image {
  border-radius: 4px;
  margin-right: 12px;
}

.menu-label {
  font-size: 1rem;
  font-weight: 500;
  color: black;
}

.menu-divider {
  background-color: var(--red-pompein);
  height: 1px;
  margin: 8px 0;
}

.mobile-slide-menu {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  display: flex;
  z-index: 2499;
}

.mobile-popover {
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
}

.hamburger {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  position: relative;
  cursor: pointer;
}

.hamburger span,
.hamburger span::before,
.hamburger span::after {
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background: white;
  border-radius: 2px;
  content: '';
  transition: all 0.3s ease-in-out;
}

.hamburger span {
  top: 50%;
  transform: translateY(-50%);
}

.hamburger span::before {
  top: -10px;
}

.hamburger span::after {
  bottom: -10px;
}

.hamburger.is-opened span {
  background: transparent;
}

.hamburger.is-opened span::before {
  top: 0;
  transform: rotate(45deg);
}

.hamburger.is-opened span::after {
  bottom: 0;
  transform: rotate(-45deg);
}

.burger-wrapper {
  display: flex;
  align-items: center;
}

.tooltip-text {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  margin-top: 50px;
}

:deep(.header-tooltip) {
  padding: 60px 14px;
  border-radius: 6px;
  font-size: 1.05rem;
}

:deep(.v-overlay-container .header-tooltip) {
  z-index: 11050 !important;
}

.admin-icon,
.api-btn,
.logo-app {
  transition: transform 0.2s ease, filter 0.2s ease;
}

.admin-icon:hover,
.api-btn:hover,
.logo-app:hover {
  transform: scale(1.05);
}

@media (max-width: 960px) {
  .logo-enc {
    width: 40px;
    margin: 0 10px 0 0;
  }

  .logo-app[data-v-d61be020] {
    height: 47px;
    transform: translateY(-1px);
  }

  .d-md-none {
    display: block !important;
  }

  .d-md-flex {
    display: none !important;
  }
}
</style>