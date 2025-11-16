// animateText.ts - Main animation function
import type { AnimationOptions, AnimationController } from './types';

/**
 * Animates text content using modern Web Animations API with fallback support.
 * Supports multiple animation types with comprehensive options and controls.
 *
 * @param element The HTML element containing text to animate
 * @param animationType The type of animation to apply
 * @param options Animation configuration options
 * @returns AnimationController for managing the animation
 * Examples
 * // Basic typewriter animation
const controller = animateText(element, 'typewriter', {
  speed: 100,
  cursor: true,
  cursorBlink: true
});

// Character reveal with stagger
animateText(element, 'character', {
  duration: 800,
  stagger: 50,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
});

// Fade in from bottom
animateText(element, 'fadein', {
  from: 'bottom',
  distance: '30px',
  duration: 1200
});
 */
export function animateText(
  element: HTMLElement,
  animationType: string,
  options: AnimationOptions = {},
): AnimationController {
  // Validate inputs
  if (!element) {
    throw new Error('Element is required for text animation');
  }

  if (!element.textContent && !element.innerText) {
    console.warn('Element contains no text content to animate');
  }

  // Default options
  const config: Required<AnimationOptions> = {
    duration: 1000,
    delay: 0,
    easing: 'ease-out',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    playState: 'running',
    speed: 50,
    pauseOnHover: false,
    onComplete: () => {},
    onStart: () => {},
    cursor: true,
    cursorChar: '|',
    cursorBlink: true,
    from: 'bottom',
    distance: '20px',
    stagger: 100,
    randomDelay: false,
    ...options,
  };

  // Store original content and styles
  const originalContent = element.textContent || '';
  // const originalStyles = getComputedStyle(element); // Reserved for future use

  // Animation registry for cleanup
  const activeAnimations: Animation[] = [];
  let animationFrame: number | null = null;

  /**
   * Creates a Web Animation with proper error handling
   */
  function createAnimation(target: Element, keyframes: Keyframe[], timing: KeyframeAnimationOptions): Animation {
    try {
      const animation = target.animate(keyframes, timing);
      activeAnimations.push(animation);
      return animation;
    } catch (error) {
      console.error('Failed to create animation:', error);
      throw new Error(`Animation creation failed: ${error}`);
    }
  }

  /**
   * Typewriter animation implementation
   */
  function typewriterAnimation(): Animation[] {
    const text = originalContent;
    const animations: Animation[] = [];

    // Clear element content
    element.textContent = '';

    // Create container for text and cursor
    const textSpan = document.createElement('span');
    const cursorSpan = document.createElement('span');

    element.appendChild(textSpan);

    if (config.cursor) {
      cursorSpan.textContent = config.cursorChar;
      cursorSpan.setAttribute('aria-hidden', 'true');
      element.appendChild(cursorSpan);

      // Cursor blink animation
      if (config.cursorBlink) {
        const cursorAnimation = createAnimation(cursorSpan, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 500,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'steps(1, end)',
        });
        animations.push(cursorAnimation);
      }
    }

    // Typewriter effect using requestAnimationFrame for better performance
    let currentIndex = 0;
    let lastTime = 0;

    function typeNextChar(timestamp: number) {
      if (timestamp - lastTime >= config.speed) {
        if (currentIndex <= text.length) {
          textSpan.textContent = text.substring(0, currentIndex);
          currentIndex++;
          lastTime = timestamp;
        }

        if (currentIndex <= text.length) {
          animationFrame = requestAnimationFrame(typeNextChar);
        } else {
          // Animation complete
          if (!config.cursor) {
            cursorSpan.remove();
          }
          config.onComplete();
        }
      } else {
        animationFrame = requestAnimationFrame(typeNextChar);
      }
    }

    // Start after delay
    setTimeout(() => {
      config.onStart();
      animationFrame = requestAnimationFrame(typeNextChar);
    }, config.delay);

    return animations;
  }

  /**
   * Fade in animation with directional slide
   */
  function fadeInAnimation(): Animation[] {
    const keyframes: Keyframe[] = [
      {
        opacity: 0,
        transform: getInitialTransform(),
      },
      {
        opacity: 1,
        transform: 'translate3d(0, 0, 0)',
      },
    ];

    const animation = createAnimation(element, keyframes, {
      duration: config.duration,
      delay: config.delay,
      easing: config.easing,
      iterations: config.iterations,
      direction: config.direction,
      fill: config.fillMode,
    });

    animation.addEventListener('start', config.onStart);
    animation.addEventListener('finish', config.onComplete);

    return [animation];
  }

  /**
   * Character-by-character animation
   */
  function characterAnimation(): Animation[] {
    const text = originalContent;
    const animations: Animation[] = [];

    // Wrap each character in a span
    element.innerHTML = '';
    const chars = text.split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
      span.style.display = 'inline-block';
      span.setAttribute('aria-hidden', 'true');
      element.appendChild(span);
      return span;
    });

    // Restore accessibility
    element.setAttribute('aria-label', text);

    // Animate each character
    chars.forEach((char, index) => {
      const delay = config.randomDelay ? Math.random() * config.stagger : index * config.stagger;

      const animation = createAnimation(
        char,
        [
          {
            opacity: 0,
            transform: 'translateY(20px) scale(0.8)',
          },
          {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
        ],
        {
          duration: config.duration / 2,
          delay: config.delay + delay,
          easing: config.easing,
          fill: config.fillMode,
        },
      );

      animations.push(animation);
    });

    // Setup completion handler
    const lastAnimation = animations[animations.length - 1];
    if (lastAnimation) {
      lastAnimation.addEventListener('start', () => {
        if (animations.indexOf(lastAnimation) === 0) config.onStart();
      });
      lastAnimation.addEventListener('finish', config.onComplete);
    }

    return animations;
  }

  /**
   * Scale animation
   */
  function scaleAnimation(): Animation[] {
    const keyframes: Keyframe[] = [
      {
        transform: 'scale(0)',
        opacity: 0,
      },
      {
        transform: 'scale(1.1)',
        opacity: 0.8,
        offset: 0.8,
      },
      {
        transform: 'scale(1)',
        opacity: 1,
      },
    ];

    const animation = createAnimation(element, keyframes, {
      duration: config.duration,
      delay: config.delay,
      easing: config.easing,
      iterations: config.iterations,
      direction: config.direction,
      fill: config.fillMode,
    });

    animation.addEventListener('start', config.onStart);
    animation.addEventListener('finish', config.onComplete);

    return [animation];
  }

  /**
   * Helper function to get initial transform based on direction
   */
  function getInitialTransform(): string {
    const distance = config.distance;
    switch (config.from) {
      case 'top':
        return `translate3d(0, -${distance}, 0)`;
      case 'bottom':
        return `translate3d(0, ${distance}, 0)`;
      case 'left':
        return `translate3d(-${distance}, 0, 0)`;
      case 'right':
        return `translate3d(${distance}, 0, 0)`;
      default:
        return `translate3d(0, ${distance}, 0)`;
    }
  }

  /**
   * Setup hover pause functionality
   */
  function setupHoverPause() {
    if (config.pauseOnHover) {
      element.addEventListener('mouseenter', () => {
        activeAnimations.forEach((anim) => {
          if (anim.playState === 'running') {
            anim.pause();
          }
        });
      });

      element.addEventListener('mouseleave', () => {
        activeAnimations.forEach((anim) => {
          if (anim.playState === 'paused') {
            anim.play();
          }
        });
      });
    }
  }

  // Animation factory
  function executeAnimation(): Animation[] {
    let animations: Animation[] = [];

    try {
      switch (animationType.toLowerCase()) {
        case 'typewriter':
          animations = typewriterAnimation();
          break;
        case 'fadein':
        case 'fade-in':
          animations = fadeInAnimation();
          break;
        case 'character':
        case 'char':
          animations = characterAnimation();
          break;
        case 'scale':
          animations = scaleAnimation();
          break;
        default:
          console.warn(`Unknown animation type: ${animationType}. Using fade-in as fallback.`);
          animations = fadeInAnimation();
          break;
      }

      setupHoverPause();
    } catch (error) {
      console.error('Animation execution failed:', error);
      config.onComplete();
    }

    return animations;
  }

  // Execute the animation
  const animations = executeAnimation();

  // Return animation controller
  const controller: AnimationController = {
    play() {
      activeAnimations.forEach((anim) => anim.play());
    },

    pause() {
      activeAnimations.forEach((anim) => anim.pause());
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    },

    reverse() {
      activeAnimations.forEach((anim) => anim.reverse());
    },

    cancel() {
      activeAnimations.forEach((anim) => anim.cancel());
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      // Restore original content
      element.textContent = originalContent;
    },

    finish() {
      activeAnimations.forEach((anim) => anim.finish());
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    },

    get finished() {
      return Promise.all(activeAnimations.map((anim) => anim.finished)).then(() => animations[0]); // Return the first animation for consistency
    },
  };

  return controller;
}
