import React from 'react';

const Footer = () => {
  return (
    <footer className="footer bg-light text-center p-3">
      <div className="container">
        <p className="mb-0">
          &copy; {new Date().getFullYear()} Hien Dinh. 
          <a 
            href="https://hiendinh.tech" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="portfolio-link"
          >
            Know more about me
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
