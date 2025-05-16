import {createStore} from 'vuex';


export default createStore({
    state: {
        apiUrl: import.meta.env.VITE_APP_API_URL,
        apiDocsUrl: import.meta.env.VITE_APP_API_DOCS,
        adminUrl: import.meta.env.VITE_APP_DB_ADMIN,
    }
});