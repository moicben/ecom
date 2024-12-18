import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Products from '../components/Products'; 
import Testimonials from '../components/Testimonials';
import About from '../components/About';
import Reviews from '../components/Reviews';

import content from '../content.json';
import productsData from '../products.json';


const Home = ({ site, products }) => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(storedCart.length);
  }, []);

  return (
    <div key={site.id} className="container">
      <Head>
        <title>{site.shopName + " - " + site.keyword + " - " + site.heroTitle}</title>
        <meta name="description" content={site.heroDescription} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <Header shopName={site.shopName} cartCount={cartCount} keywordPlurial={site.keywordPlurial}/>
        
        <section className="hero">
            <h1>{site.heroTitle}</h1>
            <p>{site.heroDescription}</p>
            <a href="/boutique"><button>Découvrir nos {site.keywordPlurial}</button></a>
            <div className='filter'></div>
            <img src={site.heroImageUrl} alt={site.sourceCategory} />
        </section>
        
        <section className="intro">
          <div className='wrapper'>
            <h2>{site.introTitle}</h2>
            <p>{site.introDescription}</p>
          </div>
        </section>

        <Products title={`Notre sélecton de ${site.keywordPlurial}`} products={products} />
        
        <About site={site}/>
        
        <Reviews site={site} product={products[0]}/>
        
        <section className="contact" id='contact'>
          <div className='wrapper'>
            <div className="contact-content">
              <h2>{site.contactTitle}</h2>
              <p>{site.contactDescription}</p>
            </div>
            <div className="contact-form">
              <form>
                <label htmlFor="name">Nom complet</label>
                <input placeholder="Paul Dupont" type="text" id="name" name="name" required />
                
                <label htmlFor="email">Email</label>
                <input placeholder='exemple@gmail.com' type="email" id="email" name="email" required />
                
                <label htmlFor="message">Votre demande</label>
                <textarea placeholder="Écrivez votre demande ici..." id="message" name="message" required></textarea>
                
                <button type="submit">Envoyer</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer shopName={site.shopName} footerText={site.footerText} />
    </div>
  );
}

export async function getStaticProps() {
  const content = await import('../content.json');
  const productsData = await import('../products.json');

  return {
    props: {
      site: content.sites[0],
      products: productsData.products,
    },
  };
}

export default Home;