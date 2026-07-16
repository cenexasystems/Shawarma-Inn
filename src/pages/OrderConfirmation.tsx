import { useLocation, Link, Navigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function OrderConfirmation() {
  const location = useLocation();
  const orderData = location.state?.orderData;

  if (!orderData) {
    return <Navigate to="/" replace />;
  }

  const { name, deliveryMethod } = orderData;

  return (
    <main className="pt-24 bg-[var(--black)] text-[var(--white)] min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto py-12">
        <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center border border-[#25D366]/20 shadow-[0_0_60px_rgba(37,211,102,0.1)] mb-8">
          <svg className="w-12 h-12 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="font-bebas text-5xl md:text-7xl uppercase text-[var(--white)] tracking-[6px] mb-4">
          Order Confirmed!
        </h1>
        
        <p className="text-[var(--white)]/60 font-body text-lg max-w-md mb-8">
          Thank you, {name}! We are preparing your order right now. Your WhatsApp message has been generated.
        </p>

        {deliveryMethod === 'self_delivery' && (
          <div className="bg-[#111111] border border-[var(--red)]/30 rounded-2xl p-6 w-full text-left relative overflow-hidden shadow-[0_0_30px_rgba(214,43,43,0.1)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--red)]" />
            <h2 className="font-bebas text-2xl tracking-[2px] uppercase text-[var(--red)] mb-2">Book Your Rapido/Porter Now</h2>
            <p className="text-sm font-body text-white/80 mb-6">
              Please book a package delivery from our Mathur outlet to your location using Rapido or Porter. Provide the rider with your order name.
            </p>
            
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-2 text-white/50 font-body">Pickup Address</label>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-white mb-6 border border-white/5">
              Shawarma Inn Mathur,<br/>
              Mathur MMDA,<br/>
              Chennai
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText("Shawarma Inn Mathur, Mathur MMDA, Chennai")}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-[2px] transition-colors"
              >
                Copy Address
              </button>
              <a
                href="https://maps.google.com/?q=Shawarma+Inn+Mathur"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-[2px] transition-colors text-center block flex items-center justify-center"
              >
                Open Google Maps
              </a>
            </div>
            
            <div className="mt-6">
              <a 
                href="https://www.rapido.bike" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bebas text-xl tracking-[2px] py-4 rounded-xl uppercase transition-colors"
              >
                Book Rapido Now
              </a>
            </div>
          </div>
        )}

        {deliveryMethod === 'pickup' && (
          <div className="bg-[#111111] border border-[var(--red)]/30 rounded-2xl p-6 w-full text-left relative overflow-hidden shadow-[0_0_30px_rgba(214,43,43,0.1)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--red)]" />
            <h2 className="font-bebas text-2xl tracking-[2px] uppercase text-[var(--red)] mb-2">Store Pickup Details</h2>
            <p className="text-sm font-body text-white/80 mb-6">
              Your order is being prepared and will be ready for pickup shortly. Skip the queue and show your name at the counter!
            </p>
            
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-2 text-white/50 font-body">Store Address</label>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-white mb-6 border border-white/5">
              Shawarma Inn Mathur,<br/>
              Mathur MMDA,<br/>
              Chennai
            </div>
            
            <a
              href="https://maps.google.com/?q=Shawarma+Inn+Mathur"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[var(--red)] hover:bg-red-700 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-[2px] transition-colors text-center block"
            >
              Get Directions
            </a>
          </div>
        )}

        {deliveryMethod === 'we_arrange' && (
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full text-center relative overflow-hidden">
            <h2 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-2">Delivery Partner Assigned</h2>
            <p className="text-sm font-body text-white/60">
              We are arranging delivery for your order. We will notify you once it is dispatched!
            </p>
          </div>
        )}

        <div className="mt-12">
          <Link to="/" className="text-white/40 hover:text-white font-body text-sm tracking-widest uppercase transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
