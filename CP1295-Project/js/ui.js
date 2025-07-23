/**
 * ui.js - UI management and event handlers
 * Functions for handling the user interface elements and interactions
 */

import { createNote, NoteManager } from './notes.js';
import { saveNotes, exportNotesAsJson, clearNotes } from './storage.js';

/**
 * Initialize UI event listeners
 * @param {NoteManager} noteManager - The note manager instance
 */
export function initializeUI(noteManager) {
    const noteBoard = document.getElementById('note-board');
    const exportBtn = document.getElementById('export-btn');
    const ascBtn = document.getElementById('ascending-btn');
    const desBtn = document.getElementById('descending-btn');

    // Double click on board to create a new note
    noteBoard.addEventListener('dblclick', (event) => {
        // Only create note if we clicked directly on the board, not on an existing note
        if (event.target === noteBoard) {
            createNewNote(event.clientX, event.clientY, noteManager);
        }
    });

    // Export button click handler
    exportBtn.addEventListener('click', () => {
        exportNotes(noteManager);
    });

    // Sort (ascending) button click handler
    ascBtn.addEventListener('click', () => {
        sortByAsc(noteManager);
    });

    // Sort (descending) button click handler
    desBtn.addEventListener('click', () => {
        sortByDesc(noteManager);
    });

    // Setup auto-save timer
    setupAutoSave(noteManager);
}

/**
 * Create a new note at the specified position
 * @param {number} x - X position for the new note
 * @param {number} y - Y position for the new note
 * @param {NoteManager} noteManager - The note manager instance
 */
export function createNewNote(x, y, noteManager) {
    // Calculate position relative to the board
    const noteBoard = document.getElementById('note-board');
    const boardRect = noteBoard.getBoundingClientRect();
    
    const boardX = x - boardRect.left;
    const boardY = y - boardRect.top;
    
    // Create the new note
    const note = createNote({
        content: '',
        x: boardX,
        y: boardY
    });
    
    // Add to manager
    noteManager.addNote(note);
    
    // Create DOM element
    const noteElement = note.createElement();
    
    // Add event listeners to the note
    setupNoteEventListeners(noteElement, note, noteManager);
    
    // Add to board
    noteBoard.appendChild(noteElement);
    
    // Focus the content area for immediate editing
    const contentElement = noteElement.querySelector('.note-content');
    contentElement.focus();
    
    return note;
}

/**
 * Set up event listeners for a note element
 * @param {HTMLElement} noteElement - The note DOM element
 * @param {Note} note - The note object
 * @param {NoteManager} noteManager - The note manager instance
 */
export function setupNoteEventListeners(noteElement, note, noteManager) {
    // Get elements
    const contentElement = noteElement.querySelector('.note-content');
    const deleteButton = noteElement.querySelector('.delete-btn');
    const quoteButton = noteElement.querySelector('.quote-btn');
    
    // Track whether the note is being dragged
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    
    // Content change handler
    contentElement.addEventListener('input', () => {
        note.updateContent(contentElement.textContent);
    });
    
    // Delete button handler
    deleteButton.addEventListener('click', () => {
        deleteNote(noteElement, note, noteManager);
    });
    
    // Quote button handler
    quoteButton.addEventListener('click', async () => {
        try {
            quoteButton.textContent = '⌛'; // Show loading indicator
            await note.addRandomQuote();
            quoteButton.textContent = '💡'; // Restore original icon
        } catch (error) {
            // Show error indicator briefly
            quoteButton.textContent = '❌';
            setTimeout(() => {
                quoteButton.textContent = '💡';
            }, 1500);
            
            // Display error in console
            console.error('Failed to fetch quote:', error);
        }
    });
    
    // Drag start
    noteElement.addEventListener('mousedown', (event) => {
        // Ignore if clicking on buttons or content area
        if (event.target === deleteButton || 
            event.target === quoteButton ||
            event.target === contentElement) {
            return;
        }
        
        // Start dragging
        isDragging = true;
        
        // Calculate offset from note's top-left corner
        const noteRect = noteElement.getBoundingClientRect();
        dragOffsetX = event.clientX - noteRect.left;
        dragOffsetY = event.clientY - noteRect.top;
        
        // Add active class for styling
        noteElement.classList.add('note-active');
        
        // Prevent text selection during drag
        event.preventDefault();
    });
    
    // Drag move
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        // Get board position and dimensions
        const noteBoard = document.getElementById('note-board');
        const boardRect = noteBoard.getBoundingClientRect();
        
        // Calculate new position relative to board
        let newX = event.clientX - boardRect.left - dragOffsetX;
        let newY = event.clientY - boardRect.top - dragOffsetY;
        
        // Keep note within board boundaries
        newX = Math.max(0, Math.min(newX, boardRect.width - noteElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, boardRect.height - noteElement.offsetHeight));
        
        // Update note position
        note.updatePosition(newX, newY);
    });
    
    // Drag end
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            noteElement.classList.remove('note-active');
        }
    });
}

/**
 * Delete a note
 * @param {HTMLElement} noteElement - The note DOM element
 * @param {Note} note - The note object
 * @param {NoteManager} noteManager - The note manager instance
 */
export function deleteNote(noteElement, note, noteManager) {
    // Add fade-out animation
    noteElement.classList.add('note-fade-out');
    
    // Remove after animation completes
    noteElement.addEventListener('animationend', () => {
        // Remove from DOM
        noteElement.remove();
        
        // Remove from manager
        noteManager.removeNote(note.id);
    });
}

/**
 * Export all notes as JSON file
 * @param {NoteManager} noteManager - The note manager instance
 */
export function exportNotes(noteManager) {
    const notes = noteManager.toJSON();
    exportNotesAsJson(notes);
}

/**
 * Setup auto-save functionality
 * @param {NoteManager} noteManager - The note manager instance
 */
export function setupAutoSave(noteManager) {
    // Save every 5 seconds if there are changes
    setInterval(() => {
        const notes = noteManager.toJSON();
        saveNotes(notes);
    }, 5000);
}

/**
 * Render all notes from manager to the board
 * @param {NoteManager} noteManager - The note manager instance
 */
export function renderAllNotes(noteManager) {
    const noteBoard = document.getElementById('note-board');
    
    // Clear existing notes
    const existingNotes = noteBoard.querySelectorAll('.note');
    existingNotes.forEach(noteElement => {
        noteElement.remove();
    });
    
    // Render all notes
    noteManager.getAllNotes().forEach(note => {
        const noteElement = note.createElement();
        setupNoteEventListeners(noteElement, note, noteManager);
        noteBoard.appendChild(noteElement);
    });
    console.log("checking that renderAllNotes is being called correctly.");
}

/**
 * Sort the notes by their timestamp in ascending order
 * @param {NoteManager} noteManager - The note manager instance
 * @param {Note} note - The note instance
 */
export function sortByAsc(noteManager){
    noteManager.sortByAscending();
    renderAllNotes(noteManager);
    let sortedNotes = [];
    sortedNotes = noteManager.getAllNotes();
    let x= 550;
    let y= 0;
    for(let i =0; i<sortedNotes.length; i++) {
        y += 50;
        sortedNotes[i].updatePosition(x,y);
    }
}

/**
 * Sort the notes by their timestamp in descending order
 * @param {NoteManager} noteManager - The note manager instance
 * @param {Note} note - The note instance
 */
export function sortByDesc(noteManager){
    noteManager.sortByDescending();
    renderAllNotes(noteManager);
    let sortedNotes = [];
    sortedNotes = noteManager.getAllNotes();
    let x= 550;
    let y= 0;
    for(let i =0; i<sortedNotes.length; i++) {
        y += 50;
        sortedNotes[i].updatePosition(x,y);
    }
}
