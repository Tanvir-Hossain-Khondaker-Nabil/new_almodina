import "./bootstrap";
import "../css/app.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import Layout from "./layouts/Layout";

createInertiaApp({
    title: (title) => (title ? `${title}` : "Page title"),
    resolve: async (name) => {
        try {
            const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
            const pagePath = `./Pages/${name}.jsx`;
            
            // console.log("Looking for page:", pagePath);
            // console.log("Available pages:", Object.keys(pages));
            
            if (!pages[pagePath]) {
                throw new Error(`Page not found: ${pagePath}`);
            }
            
            const page = pages[pagePath];
            
            // Check if page has a default export
            if (!page.default) {
                throw new Error(`Page ${name} does not have a default export`);
            }
            
            // Assign layout
            page.default.layout = page.default.layout || ((page) => <Layout children={page} />);
            
            return page;
        } catch (error) {
            console.error("Error resolving page:", error);
            throw error;
        }
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: "#009f69",
    },
});