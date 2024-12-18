const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const OpenAI = require('openai');
const { createClient } = require('pexels');
require('dotenv').config();

// Configurez votre clé API OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = createClient('TjDN5QoTIHZDUnsn72QTd8AUZZOa8ctXqmGdfiqU7dM2OoSwLdAchoa5');

// Fonction pour extraire des données spécifiques d'une URL
async function extractData(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Exemple de sélecteurs CSS pour extraire des données spécifiques
    const category = $('#zg > div > div > div:nth-child(2) > div > div > div:last-child > div:nth-child(2) > div:nth-child(1)').text().trim();
    const parent = $('#zg > div > div > div:nth-child(2) > div > div > div:last-child > div:first-child').text().trim();

    return {
        category: category,
        parent: parent
    };
}

// Fonction pour générer le contenu de la page d'accueil en utilisant l'API OpenAI
async function generateHomepageContent(data) {
    const prompt = `
    Pour la page d'accueil de ma boutique en ligne spécialisée pour les produits : ${data.category} ${data.parent} \n
    Tu vas devoir rédiger une série d'éléments de contenu précis. \n
    Chaque élément doit être unique et le plus singulier possible. \n
    Insiste sur la qualité Made in France et la pertinence de la boutique pour des acheteurs français. \n
    Voici la série d'éléments de contenu à rédiger : \n
    - Shop Name : Nom de la boutique en 2 mots clés \n
    - Hero Section : Titre accrocheur de quelques mots \n
    - Hero Section : Description de 2 phrases courtes pour la Hero Section \n
    - Hero Image : 2 mots en rapport avec les produits de la boutique. \n
    - Intro Section : Titre accrocheur pour introduire la boutique \n
    - Intro Section : Paragraphe d'introduction de la boutique attraytant de 4 phrases \n
    - About Section : Titre accrocheur d'une phrase très courte \n
    - About Section : Paragraphe de 4 phrases pour la About Section \n
    - About Image : 2 mots en rapport avec la boutique.\n
    - Testimonial Autor 1 : Prénom et nom de famille français singulier  \n
    - Testimonial Content 1 : Commentaire long de 3 phrases d'un client \n
    - Testimonial Autor 2 : Prénom et nom de famille français singulier  \n
    - Testimonial Content 2 : Commentaire long de 3 phrases d'un client \n
    - Testimonial Autor 3 : Prénom et nom de famille français singulier  \n
    - Testimonial Content 3 : Commentaire long de 3 phrases d'un client \n
    - Contact Title : Titre accrocheur d'une phrase très courte \n
    - Contact Description : Paragraphe de 2 phrases pour la section Contact \n
    - Footer Text : Texte de 2 phrases pour le footer \n
    \n
    Rédige uniquement les éléments de contenu demandés, rien d'autres \n
    N'inclus pas les indications ou le nom des sections dans ta rédaction \n
    Voici les éléments de contenu rédigés : \n
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'Tu es un assistant français specialisé en rédaction de site e-commerce singulier et attrayant. ' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 1000
    });

    return response.choices[0].message.content.trim();
}

// Fonction pour régénérer les mots clés en utilisant l'API OpenAI
async function regenerateKeywords(section) {
    const prompt = `
    Génère 2 nouveaux mots clés en rapport avec la section suivante : ${section}. \n
    Les mots clés doivent être uniques et pertinents pour la section. \n
    Réponds uniquement avec les mots clés, rien d'autre.
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'Tu es un assistant français specialisé e-commerce.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 50
    });

    return response.choices[0].message.content.trim();
}

// Fonction pour rechercher une image sur Pexels
async function searchImage(keywords) {
    const query = keywords;
    const response = await client.photos.search({
        query, per_page: 1,
        orientation: 'landscape',
        per_page: 1,
    });

    if (response.photos.length > 0) {
        return response.photos[0].src.large;
    }
    return '';
}

// Fonction principale
async function main() {
    // Lire le fichier content.json
    const content = JSON.parse(fs.readFileSync('./content.json', 'utf8'));
    const site = content.sites[0]; // Limite l'affichage au premier site

    // Extraire les données de l'URL
    const data = await extractData(site.source);

    console.log('Processing website:', site);

    // Générer le contenu de la page d'accueil
    const homepageContent = await generateHomepageContent(data);

    // Parser le contenu généré et mettre à jour content.json
    const lines = homepageContent.split('\n').map(line => line.trim()).filter(line => line);
    site.sourceParent = data.parent;
    site.sourceCategory = data.category;
    site.slug = site.sourceCategory.toLowerCase().replace(/ de/,'').replace(/ la/,'').replace(/ le/,'').replace(/l /,'').replace(/ /g, '-').replace(/é/g, 'e').replace(/[^\w-]+/g, '').replace(/---+/g, '-').replace(/--+/g, '-');
    site.shopName = lines[0];
    site.heroTitle = lines[1];
    site.heroDescription = lines[2];
    site.heroImageKeywords = lines[3];
    site.introTitle = lines[4];
    site.introDescription = lines[5];
    site.aboutTitle = lines[6];
    site.aboutDescription = lines[7];
    site.aboutImageKeywords = lines[8];
    site.testimonial1 = lines[9];
    site.author1 = lines[10];
    site.testimonial2 = lines[11];
    site.author2 = lines[12];
    site.testimonial3 = lines[13];
    site.author3 = lines[14];
    site.contactTitle = lines[15];
    site.contactDescription = lines[16];
    site.footerText = lines[17];

    // Rechercher les images sur Pexels
    site.heroImageUrl = await searchImage(lines[0]);
    site.aboutImageUrl = await searchImage(site.aboutImageKeywords);

    // Vérifier si les URLs des images sont identiques et régénérer si nécessaire
    while (site.heroImageUrl === site.aboutImageUrl) {
        console.log('Les URLs des images sont identiques, régénération des mots clés...');
        site.aboutImageKeywords = await regenerateKeywords('About Section');
        site.aboutImageUrl = await searchImage(site.aboutImageKeywords);
    }

    // Écrire les modifications dans content.json
    fs.writeFileSync('./content.json', JSON.stringify(content, null, 2), 'utf8');
}

main();