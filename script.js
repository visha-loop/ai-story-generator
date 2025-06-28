// Global variables to store app state
let currentStory = '';
let currentPrompt = '';
let currentGenre = 'adventure';
let savedStories = [];

// Configuration - Add your API key here
const API_CONFIG = {
    // Option 1: OpenAI API
    openai: {
        apiKey: 'YOUR_OPENAI_API_KEY_HERE', // Replace with your actual API key
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    
    // Option 2: Hugging Face API (free alternative)
    huggingface: {
        apiKey: 'YOUR_HUGGINGFACE_API_KEY_HERE', // Replace with your actual API key
        endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large'
    }
};

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Story Generator initialized!');
    setupEventListeners();
    loadSavedStories();
});

// Set up all event listeners
function setupEventListeners() {
    // Genre button selection
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update current genre
            currentGenre = this.dataset.genre;
            console.log('Selected genre:', currentGenre);
        });
    });

    // Enter key support for prompt input
    document.getElementById('prompt').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateStory();
        }
    });

    // Real-time character count for prompt (optional enhancement)
    document.getElementById('prompt').addEventListener('input', function() {
        const length = this.value.length;
        const maxLength = this.getAttribute('maxlength');
        console.log(`Prompt length: ${length}/${maxLength}`);
    });
}

// Main function to generate stories
async function generateStory() {
    const prompt = document.getElementById('prompt').value.trim();
    const length = document.getElementById('length').value;
    
    // Validation
    if (!prompt) {
        showAlert('Please enter a story prompt!', 'warning');
        return;
    }

    if (prompt.length < 10) {
        showAlert('Please enter a longer prompt (at least 10 characters)', 'warning');
        return;
    }

    currentPrompt = prompt;
    
    // Show loading state
    showLoading(true);
    disableGenerateButton(true);
    hideStoryOutput();

    try {
        console.log('Generating story with:', { prompt, genre: currentGenre, length });
        
        // Try to generate story with AI API
        let story;
        
        // Check if API keys are configured
        if (API_CONFIG.openai.apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
            story = await generateWithOpenAI(prompt, currentGenre, length);
        } else if (API_CONFIG.huggingface.apiKey !== 'YOUR_HUGGINGFACE_API_KEY_HERE') {
            story = await generateWithHuggingFace(prompt, currentGenre, length);
        } else {
            // Fallback to demo stories if no API key is configured
            console.log('No API key found, using demo story generator');
            story = await generateDemoStory(prompt, currentGenre, length);
        }
        
        // Display the generated story
        displayStory(story);
        showAlert('Story generated successfully! ✨', 'success');
        
    } catch (error) {
        console.error('Error generating story:', error);
        showAlert('Sorry, there was an error generating your story. Please try again!', 'error');
    } finally {
        // Hide loading state
        showLoading(false);
        disableGenerateButton(false);
    }
}

// OpenAI API integration
async function generateWithOpenAI(prompt, genre, length) {
    const lengthInstructions = {
        'short': 'Write a short story (150-200 words)',
        'medium': 'Write a medium-length story (350-500 words)',  
        'long': 'Write a long story (600-800 words)'
    };

    const response = await fetch(API_CONFIG.openai.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: `${lengthInstructions[length]} in the ${genre} genre based on this prompt: "${prompt}". Make it engaging, creative, and well-structured with proper paragraphs.`
            }],
            max_tokens: length === 'short' ? 300 : length === 'medium' ? 700 : 1000,
            temperature: 0.8
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Hugging Face API integration
async function generateWithHuggingFace(prompt, genre, length) {
    const storyPrompt = `Write a ${genre} story: ${prompt}`;
    
    const response = await fetch(API_CONFIG.huggingface.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_CONFIG.huggingface.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: storyPrompt,
            parameters: {
                max_new_tokens: length === 'short' ? 200 : length === 'medium' ? 400 : 600,
                temperature: 0.8,
                return_full_text: false,
                do_sample: true
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0].generated_text.trim();
}

// Demo story generator (fallback when no API key is available)
async function generateDemoStory(prompt, genre, length) {
    // Simulate API delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    const storyTemplates = {
        'adventure': [
            `The ancient map in Sarah's hands trembled as she approached the hidden temple. "${prompt}" - these mysterious words were etched above the entrance, glowing with an otherworldly light.

The temple's corridors were filled with intricate puzzles and deadly traps. Each step forward required courage and wit. Golden artifacts lined the walls, their surfaces covered in symbols that seemed to shift and dance in the torchlight.

Deep within the temple's heart, Sarah discovered a chamber unlike any other. The air hummed with energy, and at the center stood a crystalline pedestal holding something extraordinary - the key to an adventure beyond her wildest dreams.

As she reached for the artifact, the temple began to shake. Ancient mechanisms activated, and Sarah realized she had only moments to escape. Racing through collapsing passages, she emerged into sunlight, forever changed by her incredible journey.`,

            `Captain Maria Rodriguez gripped the ship's wheel as storm clouds gathered on the horizon. The treasure map spoke of dangers ahead, but also of riches beyond imagination. "${prompt}" was the cryptic clue that had led her crew to these treacherous waters.

The storm hit with unprecedented fury. Waves crashed over the deck as her crew fought to keep the ship afloat. Through the chaos, Maria spotted something impossible - an island that shouldn't exist, glowing with mysterious energy.

On the island's shores, they discovered ruins of an ancient civilization. The air was thick with magic, and every step revealed new wonders. Crystal caves, floating stones, and creatures thought to be legends welcomed them into a world forgotten by time.

When they finally found the treasure, it wasn't gold or jewels - it was knowledge, power, and the realization that some adventures change you forever. Maria and her crew had become guardians of secrets that would reshape the world.`
        ],
        
        'mystery': [
            `Detective Emma Cross examined the crime scene with growing bewilderment. The victim's final words, "${prompt}", were scrawled on the wall in what appeared to be invisible ink, only visible under UV light.

The apartment was immaculate, almost suspiciously so. No signs of struggle, no fingerprints, nothing out of place except for a single white rose on the dining table. Emma photographed everything, but something nagged at her - this felt too perfect, too orchestrated.

Hours of investigation revealed discrepancies in the timeline. Security footage showed someone entering the building who didn't match any witness descriptions. The deeper Emma dug, the more she realized this wasn't a random crime - it was personal.

The breakthrough came when Emma discovered the victim's secret. Hidden behind a false wall was a room filled with evidence of corruption that reached the highest levels of government. The killer wasn't just removing a witness - they were protecting an empire built on lies.`,

            `The locked room mystery had stumped the police for weeks. Professor Williams had been found dead in his study, doors and windows locked from the inside, with no apparent cause of death. The only clue was a note reading "${prompt}" in his own handwriting.

Consulting detective Alex Harper noticed what others had missed - the victim's books were arranged in a specific pattern, creating a code that revealed a hidden compartment. Inside was evidence of a conspiracy spanning decades.

The professor had discovered something that powerful people wanted to remain buried. His death wasn't suicide or accident - it was an elaborate murder designed to look impossible. The killer had used the victim's own research against him.

As Alex pieced together the truth, they realized the danger was far from over. The conspiracy was still active, and now Alex had become the next target in a deadly game of secrets and lies.`
        ],
        
        'sci-fi': [
            `Dr. Elena Vasquez received the signal at 03:47 GMT. The message from deep space contained only five words: "${prompt}". After decades of searching for extraterrestrial intelligence, humanity finally had proof - we were not alone.

The signal originated from a region of space previously thought to be empty. As Elena's team analyzed the data, they discovered something extraordinary - the message was accompanied by mathematical proofs that advanced human understanding by centuries.

Within days, more signals arrived, each containing blueprints for technologies that could revolutionize civilization. Clean energy, faster-than-light travel, medical advances that could eliminate disease - it was as if the universe was offering humanity a graduation gift.

But Elena soon realized the truth was more complex. The aliens weren't just sharing knowledge - they were testing humanity's readiness to join a galactic community. Earth's response to these gifts would determine whether we were ready for the next phase of our evolution.`,

            `The time portal flickered to life in Dr. Marcus Chen's laboratory. After years of theoretical work, he had finally cracked the secret of temporal displacement. The first message he sent to himself in the past was simple: "${prompt}".

But when Marcus stepped through the portal, he discovered that time travel was nothing like the movies had portrayed. Reality was fluid, malleable, and incredibly dangerous to manipulate. Every change created ripples that threatened to tear apart the fabric of existence.

In the future he visited, humanity had transcended physical form, becoming beings of pure energy and consciousness. They welcomed Marcus as the catalyst who would begin humanity's transformation, but warned him of the choices ahead.

Returning to his own time, Marcus faced an impossible decision. He could share his discovery and accelerate human evolution, or destroy his work to preserve the timeline. The future of the species rested in his hands.`
        ],
        
        'fantasy': [
            `The ancient prophecy spoke of this moment: "${prompt}". Lyra clutched the enchanted staff, feeling its magic pulse through her veins like liquid starlight. The fate of the realm hung in the balance.

Around her, the mystical forest came alive with power. Trees swayed without wind, their leaves shimmering with ethereal light. Creatures of legend emerged from the shadows - unicorns with manes like silver fire, phoenixes whose songs could heal the dying, and ancient dragons who remembered the world's first dawn.

As the chosen one, Lyra understood that her destiny was intertwined with the magic itself. The dark sorcerer's army was approaching, their corruption spreading like poison through the land. Only she possessed the pure heart necessary to wield the staff's ultimate power.

The final battle erupted in a symphony of magic and steel. Light clashed against darkness as Lyra channeled the combined power of all living things. When the dust settled, the realm was reborn, and magic flowed freely once more through a world at peace.`,

            `In the hidden kingdom of Aethermoor, where magic was woven into the very air, young mage Kieran discovered an ancient scroll bearing the words "${prompt}". The prophecy spoke of a chosen one who would either save or doom all magical realms.

The scroll revealed the location of the Nexus of Worlds - a place where all realities converged. But reaching it required passing through the Trials of Elements: facing the fury of fire, the depths of water, the heights of air, and the strength of earth.

Each trial tested not just Kieran's magical ability, but their character, wisdom, and heart. Along the way, they gathered allies: a shapeshifting druid, a warrior princess from the mountain clans, and a mysterious figure whose true identity would reshape everything Kieran believed.

At the Nexus, Kieran faced the ultimate choice - use their power to rule all worlds, or sacrifice themselves to preserve the balance between magic and mundane. Their decision would echo through eternity, defining the future of all existence.`
        ]
    };

    // Select appropriate stories based on genre
    const genreStories = storyTemplates[genre] || storyTemplates['adventure'];
    const selectedStory = genreStories[Math.floor(Math.random() * genreStories.length)];
    
    // Adjust length if needed
    if (length === 'short') {
        return selectedStory.split('\n\n').slice(0, 2).join('\n\n');
    } else if (length === 'long') {
        return selectedStory + '\n\nThe adventure continued, leading to new discoveries and challenges that would test our hero in ways they never imagined...';
    }
    
    return selectedStory;
}

// Display the generated story
function displayStory(story) {
    currentStory = story;
    document.getElementById('storyText').textContent = story;
    document.getElementById('storyOutput').classList.add('active');
    
    // Smooth scroll to story
    setTimeout(() => {
        document.getElementById('storyOutput').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
}

// Save story to local storage
function saveStory() {
    if (!currentStory) {
        showAlert('No story to save!', 'warning');
        return;
    }
    
    const storyData = {
        id: Date.now(),
        title: currentPrompt,
        text: currentStory,
        genre: currentGenre,
        timestamp: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    savedStories.unshift(storyData);
    
    // Keep only last 10 stories to avoid storage bloat
    if (savedStories.length > 10) {
        savedStories = savedStories.slice(0, 10);
    }
    
    localStorage.setItem('aiStoryGenerator_savedStories', JSON.stringify(savedStories));
    loadSavedStories();
    showAlert('Story saved successfully! 💾', 'success');
}

// Copy story to clipboard
async function copyStory() {
    if (!currentStory) {
        showAlert('No story to copy!', 'warning');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentStory);
        showAlert('Story copied to clipboard! 📋', 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentStory;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('Story copied to clipboard! 📋', 'success');
    }
}

// Share story (uses Web Share API if available)
async function shareStory() {
    if (!currentStory) {
        showAlert('No story to share!', 'warning');
        return;
    }
    
    const shareData = {
        title: 'Check out this AI-generated story!',
        text: `Story: "${currentPrompt}"\n\n${currentStory}\n\nGenerated by AI Story Generator`,
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showAlert('Story shared successfully! 🔗', 'success');
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareData.text);
            showAlert('Story copied to clipboard for sharing! 🔗', 'success');
        }
    } catch (err) {
        console.error('Error sharing:', err);
        copyStory(); // Fallback to copy function
    }
}

// Regenerate the current story
function regenerateStory() {
    if (!currentPrompt) {
        showAlert('Please enter a prompt first!', 'warning');
        return;
    }
    
    generateStory();
}

// Load saved stories from local storage
function loadSavedStories() {
    const stored = localStorage.getItem('aiStoryGenerator_savedStories');
    if (stored) {
        savedStories = JSON.parse(stored);
    }
    
    const savedStoriesDiv = document.getElementById('savedStories');
    const savedStoriesList = document.getElementById('savedStoriesList');
    
    if (savedStories.length === 0) {
        savedStoriesDiv.style.display = 'none';
        return;
    }
    
    savedStoriesDiv.style.display = 'block';
    savedStoriesList.innerHTML = '';
    
    savedStories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.className = 'saved-story-item';
        storyItem.innerHTML = `
            <div class="saved-story-title">${story.title} (${story.genre})</div>
            <div class="saved-story-preview">${story.text.substring(0, 150)}...</div>
            <small style="color: #999; font-size: 0.8rem;">Saved on ${story.timestamp}</small>
        `;
        
        storyItem.addEventListener('click', () => {
            displayStory(story.text);
            currentStory = story.text;
            currentPrompt = story.title;
        });
        
        savedStoriesList.appendChild(storyItem);
    });
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

function disableGenerateButton(disable) {
    const button = document.querySelector('.generate-btn');
    button.disabled = disable;
    if (disable) {
        button.textContent = 'Generating... ✨';
    } else {
        button.textContent = 'Generate Story ✨';
    }
}

function hideStoryOutput() {
    document.getElementById('storyOutput').classList.remove('active');
}

function showAlert(message, type = 'info') {
    // Create a simple alert system
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Set colors based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444', 
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alertDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS for alert animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✨ AI Story Generator loaded successfully!');