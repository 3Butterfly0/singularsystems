import { Link } from "react-router-dom";
// import { Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white pt-20 pb-12 px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight">
                SingularSystems
              </span>
            </Link>
            <p className="text-[15px] text-gray-400 leading-relaxed max-w-sm">
              "We craft high-performance PCs tailored for discerning creatives,
              from gamers to videographers, ensuring every user experiences
              unmatched precision, power, and passion in their digital
              endeavors."
            </p>
            {/* <div className="flex gap-4">
              <a href="#" className="p-1 hover:text-[#9E00FF] transition-colors">
                <Facebook className="w-5 h-5 fill-current" />
              </a>
              <a href="#" className="p-1 hover:text-[#9E00FF] transition-colors">
                <Linkedin className="w-5 h-5 fill-current" />
              </a>
              <a href="#" className="p-1 hover:text-[#9E00FF] transition-colors">
                <Twitter className="w-5 h-5 fill-current" />
              </a>
              <a href="#" className="p-1 hover:text-[#9E00FF] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div> */}
          </div>

          <div className="space-y-6">
            <h4 className="text-[17px] font-bold">Our Company</h4>
            <ul className="space-y-4 text-[15px] text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="hover:text-white transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h4 className="text-[17px] font-bold">Services</h4>
            <ul className="space-y-4 text-[15px] text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Businesses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Enterprises
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Education
                </a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-6">
            <h4 className="text-[17px] font-bold">Policies</h4>
            <ul className="space-y-4 text-[15px] text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Warranty
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Returns and Refund
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Workplace Policies
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
