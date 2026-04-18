// src/App.jsx
import { Routes, Route } from 'react-router-dom';

import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails'
import Shop from './pages/Shop'
import Home from './pages/Home';
import Login from './pages/Login'
import Profile  from './pages/Profile'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Footer from './components/layout/Footer';
import Contact from './pages/Contact'
import InfoPage from './pages/InfoPage';
import TrackOrder from './pages/TrackOrder';
import Invoice from './pages/Invoice';
import DeliveryDashboard from './pages/DeliveryDashboard'
// --- PAGE CONTENT CONFIGURATIONS ---

const aboutContent = [
  { heading: 'Our Story', content: 'Founded in Pune, UtensilPro began with a simple mission: to bring restaurant-quality kitchenware to everyday home chefs. We source our products directly from top manufacturers to ensure quality and durability.' },
  { heading: 'Our Promise', content: 'We believe that the right tools make cooking a joy, not a chore. Every item in our catalog is strictly tested by our team before it makes it to our shelves.' }
];

const shippingContent = [
  { heading: 'Order Processing', content: 'All orders are processed within 1-2 business days. You will receive a confirmation email once your order has shipped containing your tracking number(s).' },
  { heading: 'Delivery Times', content: ['Pune Local Delivery: 1-2 Days', 'Maharashtra State: 3-5 Days', 'Rest of India: 5-7 Days'] }
];

const returnContent = [
  { heading: '30-Day Return Policy', content: 'If you are not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund. Items must be unused and in their original packaging.' },
  { heading: 'How to Return', content: 'Simply email our support team at support@utensilpro.com with your order number, and we will provide you with a return shipping label.' }
];

const faqContent = [
  { heading: 'Are your products dishwasher safe?', content: 'Most of our stainless steel and glass products are dishwasher safe. However, we recommend hand-washing non-stick cookware to prolong its lifespan.' },
  { heading: 'Do you offer bulk discounts for restaurants?', content: 'Yes! We have a dedicated B2B team. Please use the Contact Us page to inquire about wholesale pricing.' }
];
function App() {
  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

{/*        <Navbar/> */}
      <main style={{ flex: 1, width: '100%' }}>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/shop" element={<Shop/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/profile" element={<Profile/>}/>
            <Route path="/register" element={<Register/>}/>
             <Route path="/admin" element={<AdminDashboard/>}/>
             <Route path='/contact' element={<Contact/>}/>
             <Route path="/about" element={<InfoPage title="About Us" sections={aboutContent} />} />
                         <Route path="/shipping" element={<InfoPage title="Shipping Policy" lastUpdated="March 2026" sections={shippingContent} />} />
                         <Route path="/returns" element={<InfoPage title="Returns & Exchanges" lastUpdated="April 2026" sections={returnContent} />} />
                         <Route path="/faq" element={<InfoPage title="Frequently Asked Questions" sections={faqContent} />} />
        <Route path="/orders" element={<TrackOrder />} />
        <Route path="/invoice/:orderId" element={<Invoice />} />
        <Route path="/delivery" element={<DeliveryDashboard/>}/>
        </Routes>

      </main>
   <Footer />
    </div>
  );
}

export default App;