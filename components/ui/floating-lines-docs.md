# Floating Lines Component Documentation

## Overview
The Floating Lines component creates an animated background with smooth flowing lines that move across the screen. It uses Three.js for WebGL rendering and provides interactive features like mouse tracking and parallax effects.

## Component Structure

### Main Component: `floating-lines.tsx`
- **Location**: `components/ui/floating-lines.tsx`
- **Dependencies**: Three.js, React hooks
- **Purpose**: Renders animated floating lines with customizable properties

### CSS Module: `floating-lines.css`
- **Location**: `components/ui/floating-lines.css`
- **Purpose**: Provides responsive styling, contrast overlays, and accessibility features

## Usage

### Basic Implementation
```tsx
import FloatingLines from "@/components/ui/floating-lines"

<FloatingLines
  linesGradient={['#f59e0b', '#dc2626', '#7c3aed']}
  enabledWaves={['top', 'middle', 'bottom']}
  lineCount={[6, 10, 12]}
  lineDistance={[8, 5, 4]}
  animationSpeed={0.6}
  interactive={true}
  parallax={true}
/>
```

### Integration in About Section
The component is integrated into the about section with optimized settings:
- **Colors**: Orange (#f59e0b), Red (#dc2626), Purple (#7c3aed)
- **Animation Speed**: 0.6 (moderate speed)
- **Interactive**: Mouse tracking enabled
- **Parallax**: Subtle parallax effect (0.1 strength)
- **Contrast**: Enhanced with CSS overlay for text readability

## Configuration Parameters

### Visual Properties
- `linesGradient`: Array of hex colors for line gradients
- `enabledWaves`: Array of wave positions ('top', 'middle', 'bottom')
- `lineCount`: Array of line counts per wave [top, middle, bottom]
- `lineDistance`: Array of distances between lines

### Animation Settings
- `animationSpeed`: Speed multiplier (0.1 - 2.0)
- `bendRadius`: Curve radius for line bending
- `bendStrength`: Strength of line curvature (-1.0 to 1.0)

### Interactive Features
- `interactive`: Enable/disable mouse interaction
- `mouseDamping`: Smoothing factor for mouse movement
- `parallax`: Enable/disable parallax scrolling
- `parallaxStrength`: Intensity of parallax effect

### Positioning
- `topWavePosition`: {x, y, rotate} for top wave
- `middleWavePosition`: {x, y, rotate} for middle wave
- `bottomWavePosition`: {x, y, rotate} for bottom wave

### Rendering
- `mixBlendMode`: CSS blend mode ('screen', 'multiply', 'overlay')

## CSS Classes and Animations

### Container Classes
- `.floating-lines-container`: Main container with absolute positioning
- `.floating-lines-overlay`: Contrast overlay for text readability

### Responsive Classes
- Mobile (max-width: 640px): Reduced opacity (0.6)
- Tablet (max-width: 768px): Reduced opacity (0.8)
- Desktop: Full opacity with enhanced contrast

### Accessibility Classes
- `@media (prefers-reduced-motion: reduce)`: Disables animations
- `@media (prefers-contrast: high)`: Enhanced contrast mode
- `@media (prefers-color-scheme: dark)`: Dark mode optimizations

### Section-Specific Classes
- `#about .floating-lines-container`: Blur filter and opacity adjustment
- `#about .floating-lines-overlay`: Custom gradient for about section

## Performance Optimizations

### Three.js Settings
- WebGL renderer with antialiasing
- Orthographic camera for 2D projection
- Efficient geometry and material management
- Automatic cleanup on unmount

### Animation Optimizations
- RequestAnimationFrame for smooth 60fps
- Efficient shader programs
- Minimal DOM manipulation
- Debounced resize handling

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Fallback Support
- Graceful degradation for WebGL-disabled browsers
- CSS-only background fallback
- No JavaScript errors on unsupported browsers

## Responsive Behavior

### Mobile Devices (< 640px)
- Reduced animation complexity
- Lower opacity for better text contrast
- Touch-friendly interaction
- Optimized performance

### Tablets (640px - 1024px)
- Medium animation complexity
- Balanced opacity settings
- Smooth touch interactions
- Good performance balance

### Desktop (> 1024px)
- Full animation complexity
- High opacity with contrast overlay
- Mouse interaction support
- Maximum visual quality

## Accessibility Features

### Screen Reader Support
- Proper ARIA labels
- Semantic HTML structure
- No interfering animations for screen readers

### Keyboard Navigation
- No interference with keyboard focus
- Maintains tab order
- Respects focus indicators

### Motion Preferences
- Respects `prefers-reduced-motion`
- Respects `prefers-contrast`
- Respects `prefers-color-scheme`

## Troubleshooting

### Common Issues
1. **Lines not visible**: Check CSS z-index and positioning
2. **Poor performance**: Reduce line count and animation speed
3. **Text hard to read**: Adjust overlay opacity and gradient
4. **Mobile issues**: Check responsive breakpoints and touch events

### Debug Mode
Enable debug mode by adding `debug={true}` prop to see:
- FPS counter
- WebGL context info
- Animation frame timing

## Future Enhancements

### Planned Features
- Custom shader support
- SVG fallback for older browsers
- Performance monitoring
- Theme integration
- Animation presets

### API Improvements
- TypeScript strict mode
- Better error boundaries
- Performance metrics
- Custom event handlers