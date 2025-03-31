<h1>FlavorFinder</h1>
<p>A culinary application built with Next.js that allows users to search recipes, view nutritional information, and calculate costs with currency conversion. Live at: <a href="https://flavorfinder-ph.netlify.app/" target="_blank">flavorfinder-ph.netlify.app</a></p>

<h2>Getting Started</h2>
<p>To run this project locally, follow these steps:</p>

<p>Clone the Repository:</p>
<pre><code>git clone https://github.com/your-username/flavor-finder.git
cd flavor-finder</code></pre>

<p>Install Dependencies:</p>
<pre><code>npm install</code></pre>

<p>Run the Development Server:</p>
<pre><code>npm run dev</code></pre>

<p>Open in Your Browser:</p>
<p>Visit <a href="http://localhost:3000">http://localhost:3000</a> to use the application locally or view the live site at <a href="https://flavorfinder-ph.netlify.app/" target="_blank">flavorfinder-ph.netlify.app</a></p>

<h2>Key Features</h2>
<ul>
  <li><strong>Recipe Discovery:</strong> Search thousands of recipes from TheMealDB API</li>
  <li><strong>Nutrition Insights:</strong> Automatic calorie estimation for each recipe</li>
  <li><strong>Cost Analysis:</strong> Recipe cost calculation in Naira with USD conversion</li>
  <li><strong>Restaurant Locator:</strong> Find nearby dining options using geolocation</li>
  <li><strong>Beautiful UI:</strong> Animated transitions and Lottie animations</li>
  <li><strong>Responsive Design:</strong> Works perfectly on all devices</li>
</ul>

<h2>Tech Stack</h2>
<ul>
  <li><strong>Frontend:</strong> Next.js, TypeScript, Tailwind CSS</li>
  <li><strong>Animation:</strong> Framer Motion, Lottie</li>
  <li><strong>State Management:</strong> React Query</li>
  <li><strong>APIs:</strong> TheMealDB, ExchangeRate-API, OpenStreetMap</li>
  <li><strong>Hosting:</strong> Netlify</li>
</ul>

<h2>API Integration</h2>
<ul>
  <li><strong>Recipe Search:</strong> /api/recipes?q={query}</li>
  <li><strong>Currency Conversion:</strong> /api/exchange</li>
  <li><strong>Restaurant Finder:</strong> /api/restaurants?lat={latitude}&lon={longitude}</li>
</ul>

<h2>Deployment</h2>
<p>The application is automatically deployed to Netlify on every push to main branch:</p>
<pre><code>1. Push changes to GitHub repository
2. Netlify automatically builds and deploys
3. Updates go live at https://flavorfinder-ph.netlify.app/</code></pre>

<h2>Contributing</h2>
<p>We welcome contributions! Please follow these steps:</p>
<ol>
  <li>Fork the repository</li>
  <li>Create your feature branch (git checkout -b feature/amazing-feature)</li>
  <li>Commit your changes (git commit -m 'Add some amazing feature')</li>
  <li>Push to the branch (git push origin feature/amazing-feature)</li>
  <li>Open a Pull Request</li>
</ol>

<h2 style="text-align: center;">Design Philosophy</h2>
<p style="text-align: center;">
Built with a focus on:<br>
- Delightful user experience with animations<br>
- Clean, card-based interface<br>
- Purple color theme<br>
- Comprehensive nutrition and cost information
</p>

<h2>License</h2>
<p>MIT License - See <a href="LICENSE">LICENSE</a> file for details</p>

<h2>Contact</h2>
<p>For support or feature requests:</p>
<ul>
  <li>GitHub Issues: <a href="https://github.com/your-username/flavor-finder/issues">Report an issue</a></li>
</ul>
