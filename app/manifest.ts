import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "GitHub Readme Stats Generator",
        short_name: "GitHub Stats",
        description: "Elevate your GitHub README with dynamic, beautiful, and real-time statistics.",
        start_url: "/",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#09090b",
    };
}