# 🎲 Zero Limit Breakthrough Club - Mid-Autumn Festival 3D Dice Game

## 🏮 Event Introduction

Welcome to the **Zero Limit Breakthrough Club** Mid-Autumn Festival Gaming Support Event! This is a custom 3D dice game designed specifically for the Mid-Autumn Festival, combining traditional Chinese dice elements with modern 3D technology to provide an immersive gaming experience for club members and friends.

## ✨ Game Features

### 🎯 Core Functions
- **Flexible Dice Selection**: Support for 1-6 dice rolling simultaneously
- **Realistic 3D Effects**: Each die rotates authentically in 3D space
- **Traditional Chinese Style**: Dots 1 and 4 feature traditional red coloring
- **Immersive Animation**: 2.5-second rotation with individual delay for each die
- **Real-time Scoring**: Automatic calculation and display of total points
- **Responsive Design**: Perfect experience on both desktop and mobile devices

### 🎨 Visual Design
- **Club Branding**: Official Zero Limit Breakthrough Club logo integration
- **Festive Theme**: Mid-Autumn Festival special edition styling
- **Modern UI**: Gradient backgrounds and smooth animations
- **Professional Layout**: Clean, intuitive interface design

## 📱 Device Compatibility

### 💻 Desktop Experience
- **Full 3D Effects**: Complete CSS 3D transformations
- **Large Display**: 100px club logo and optimal dice size
- **Hover Interactions**: Enhanced button feedback

### 📱 Mobile Experience
- **Touch Optimized**: Finger-friendly button sizes
- **Responsive Layout**: Automatic screen size adaptation
- **3D Performance**: Smooth animations on mobile browsers
- **Portrait/Landscape**: Optimized for both orientations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone [your-repository-url]
cd dice-game

# Install dependencies
npm install

# Start development server
npm start
```

### Mobile Access
1. Start the development server with `npm start`
2. Find the network address (usually shown as `On Your Network: http://192.168.x.x:3000`)
3. Connect your mobile device to the same WiFi network
4. Open the network address in your mobile browser

## 🎮 How to Play

### Step 1: Select Dice Quantity
- Choose from 1 to 6 dice using the selection grid
- See real-time feedback of your selection
- Click "Start Game" to proceed

### Step 2: Roll the Dice
- Click the "Roll Dice" button to start the 3D animation
- Watch each die rotate independently in 3D space
- Wait for the 2.5-second animation to complete

### Step 3: View Results
- See individual die results with traditional Chinese styling
- View the total score automatically calculated
- Roll again or return to change the number of dice

## 🏗️ Technical Architecture

### Frontend Framework
- **React 18+**: Modern React with Hooks
- **Pure CSS**: No external CSS frameworks, fully custom styling
- **CSS 3D Transforms**: Hardware-accelerated 3D animations
- **Responsive Design**: Mobile-first approach

### Key Components
- **DiceGame.jsx**: Main game component with state management
- **Dice3D**: Individual 3D dice component with rotation logic
- **DiceGame.css**: Complete styling with 3D effects and animations

### File Structure
```
src/
├── DiceGame.jsx          # Main game component
├── DiceGame.css          # Complete styling
├── pic/
│   └── logo.png         # Club logo image
└── App.js               # Application entry point
```

## 🎨 Customization

### Brand Elements
- **Logo**: Replace `src/pic/logo.png` with your organization's logo
- **Colors**: Modify CSS custom properties for brand colors
- **Text**: Update club name and slogans in component files

### Game Mechanics
- **Dice Count**: Modify the range in the number selection array
- **Animation Duration**: Adjust timeout values in `rollDice()` function
- **Dice Faces**: Customize dot patterns in `getDotPattern()` function

## 🌐 Deployment Options

### Development
```bash
npm start                 # Local development with hot reload
```

### Production Build
```bash
npm run build            # Creates optimized production build
```

### Deployment Platforms
- **Netlify**: Drag-and-drop deployment from build folder
- **Vercel**: GitHub integration with automatic deployments  
- **GitHub Pages**: Free hosting for static sites
- **Custom Server**: Deploy build folder to any web server

## 🎯 Zero Limit Breakthrough Club

### About the Club
Zero Limit Breakthrough Club is dedicated to pushing boundaries and creating unlimited possibilities. This Mid-Autumn Festival gaming event represents our commitment to innovation while honoring traditional culture.

### Event Goals
- **Community Building**: Bring members together through interactive gaming
- **Cultural Celebration**: Honor Mid-Autumn Festival traditions
- **Technology Showcase**: Demonstrate modern web technologies
- **Member Engagement**: Provide entertaining and memorable experiences

## 📄 License & Credits

### Copyright
© 2024 Zero Limit Breakthrough Club. All rights reserved.

### Slogan
"突破极限，创造无限可能" (Breaking Limits, Creating Infinite Possibilities)

### Special Thanks
- Mid-Autumn Festival Special Edition
- Developed for Zero Limit Breakthrough Club Gaming Support Event
- Traditional Chinese dice styling inspiration

## 🤝 Contributing

We welcome contributions from club members and the community:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions about the Mid-Autumn Festival gaming event:

- **Club Website**: [Your club website]
- **Event Coordinator**: [Contact information]
- **Technical Issues**: [Technical support contact]

---

**Happy Mid-Autumn Festival! 🥮**  
*Zero Limit Breakthrough Club - Mid-Autumn Gaming Support Event*