<template>
  <div>
    <v-app-bar class="app-navbar">
      <v-container fluid class="header-container">
        <div class="header-logos">
          <v-img :src="logoENC" alt="Logo ENC" class="logo logo-enc" contain @click="goToWebsite('https://www.chartes.psl.eu/')" />
          <v-img :src="logoSrc" alt="Logo App" class="logo logo-app" contain @click="$router.push('/home')" />
        </div>

        <div class="burger-wrapper d-md-none">
          <button class="hamburger" :class="{ 'is-opened': drawer }" @click="drawer = !drawer">
            <span></span>
          </button>
        </div>

        <div class="d-none d-md-flex">
          <v-btn @click="goToWebsite(adminUrl)">
            <v-icon color="white" size="47" class="admin-icon">mdi-account-circle</v-icon>
          </v-btn>
          <v-img :src="logoAPI" alt="API Icon" class="api-btn" contain @click="goToWebsite(apiDocsUrl)" />
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

          <v-divider class="menu-divider" />

          <v-list-item @click="goToWebsite(apiDocsUrl)">
            <template #prepend>
              <v-img :src="logoAPI" height="24" width="24" class="menu-icon-image" />
            </template>
            <v-list-item-title class="menu-label">Documentation d'API</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';
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
  background-color: var(--brown) !important;
  padding: 0 !important;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.logo-app {
  width: 125px;
  height: 100px;
}

.logo:hover {
  filter: brightness(0.8);
}

.api-btn {
  background-color: var(--brown);
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

.menu-icon {
    margin-right: -20px ;
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
  background-color: var(--brown);
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
  z-index: 999;
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

@media (max-width: 960px) {
  .d-md-none {
    display: block !important;
  }

  .d-md-flex {
    display: none !important;
  }
}
</style>