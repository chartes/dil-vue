import {createRouter, createWebHistory} from 'vue-router';

import HomeView from '@/views/HomeView.vue';
import ListView from "@/views/ListView.vue";
import InfoView from '@/views/InfoView.vue';
import NotFoundView from "@/views/NotFoundView.vue";
import DetailView from "@/views/DetailView.vue";

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView
    },
    {
        path: '/list',
        name: 'list',
        component: ListView
    },
    {
        path: '/info',
        name: 'info',
        component: InfoView
    },
    {
        path:'/detail/:id',
        name:'detail',
        component: DetailView,
    },
    {
        // catch-all route
        path: '/:catchAll(.*)',
        name: 'not-found',
        component:NotFoundView
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})
export default router
