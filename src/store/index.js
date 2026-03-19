import {createStore} from 'vuex';

const LIST_VIEW_STORAGE_KEY = 'dil:listViewState';

function loadListViewState() {
    try {
        const raw = sessionStorage.getItem(LIST_VIEW_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Erreur de lecture sessionStorage:', e);
        return null;
    }
}

function saveListViewState(state) {
    try {
        sessionStorage.setItem(LIST_VIEW_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Erreur d’écriture sessionStorage:', e);
    }
}

function clearListViewState() {
    try {
        sessionStorage.removeItem(LIST_VIEW_STORAGE_KEY);
    } catch (e) {
        console.error('Erreur de suppression sessionStorage:', e);
    }
}

export default createStore({
    state: {
        apiUrl: import.meta.env.VITE_APP_API_URL,
        apiDocsUrl: import.meta.env.VITE_APP_API_DOCS,
        adminUrl: import.meta.env.VITE_APP_DB_ADMIN,
        listViewState: loadListViewState(),
        forceOpenMap: false
    },

    mutations: {
        SET_LIST_VIEW_STATE(state, payload) {
            state.listViewState = payload;
            saveListViewState(payload);
        },
        CLEAR_LIST_VIEW_STATE(state) {
            state.listViewState = null;
            clearListViewState();
        },
        SET_FORCE_OPEN_MAP(state, value) {
            state.forceOpenMap = !!value;
        }
    }
});