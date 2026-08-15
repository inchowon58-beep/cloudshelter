import Header from "./components/Header";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Philosophy from "./components/Philosophy";
import Products from "./components/Products";
import Reviews from "./components/Reviews";
import Concept from "./components/Concept";
import Gallery from "./components/Gallery";
import OrderForm from "./components/OrderForm";
import Footer from "./components/Footer";
import FixedCTA from "./components/FixedCTA";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Philosophy />
        <Products />
        <Reviews />
        <Concept />
        <Gallery />
        <OrderForm />
      </main>
      <Footer />
      <FixedCTA />
    </>
  );
}
