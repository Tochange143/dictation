#!/usr/bin/env python3
"""
Generate Level 2 (Intermediate) Lessons 36 - 70
Word count per lesson: strictly 950 - 1050 words
Focus: Compound & complex sentences, college, work, travel, friendships, daily life.
"""
import os
import json
import re
from generate_all import build_lesson, split_into_sentences

LEVEL_2_TOPICS = [
    (36, "Moving into the University Dormitory", "Unpacking cardboard boxes, meeting an unfamiliar roommate, and arranging study desks."),
    (37, "The First Day of University Lectures", "Finding lecture auditoriums, understanding syllabus requirements, and making course notes."),
    (38, "Collaborative Study at the Campus Library", "Reviewing lecture notes with classmates on a quiet Tuesday afternoon."),
    (39, "Working a Weekend Shift at the Coffee Shop", "Steaming whole milk, greeting early morning commuters, and handling customer orders."),
    (40, "Cooking a Shared Dinner with Roommates", "Negotiating grocery expenses, slicing fresh vegetables, and sharing dinner stories."),
    (41, "Preparing Thoroughly for Midterm Examinations", "Creating comprehensive study schedules, using flashcards, and managing academic stress."),
    (42, "A Scenic Weekend Train Journey Across the Countryside", "Watching rolling hills through the compartment window while sipping warm tea."),
    (43, "Exploring Contemporary Masterpieces at the City Museum", "Walking through quiet gallery rooms admiring oil paintings and bronze sculptures."),
    (44, "Handling an Unexpected Bicycle Flat Tire", "Using portable tire levers, locating a puncture, and repairing the inner tube calmly."),
    (45, "Saturday Morning at the Bustling Farmers Market", "Selecting ripe organic strawberries, artisan sourdough bread, and local lavender honey."),
    (46, "Establishing a Consistent Morning Jogging Routine", "Lacing running shoes at sunrise, maintaining pacing, and tracking cardiovascular progress."),
    (47, "Planning a Weekend Camping Expedition with Friends", "Checking waterproof tents, sleeping bags, portable cooking stoves, and trail maps."),
    (48, "Adopting an Abandoned Rescue Cat from the Shelter", "Completing adoption paperwork, preparing scratching posts, and earning feline trust."),
    (49, "Managing Personal Monthly Living Expenses and Budgets", "Tracking utility bills, grocery receipts, discretionary spending, and emergency savings."),
    (50, "Overcoming Stage Fright During Class Presentations", "Practicing vocal projection, breathing exercises, and maintaining confident eye contact."),
    (51, "A Peaceful Afternoon in the Local Botanical Conservatory", "Observing tropical orchid species, carnivorous plants, and shaded bamboo walkways."),
    (52, "Diagnosing and Repairing an Overheating Laptop", "Backing up essential data, dusting cooling fans, and applying fresh thermal paste."),
    (53, "Volunteering on Saturdays at the Regional Animal Sanctuary", "Grooming rescued horses, feeding baby goats, and rebuilding wooden boundary fences."),
    (54, "Mastering the Traditional Technique of Homemade Pasta", "Kneading semolina dough, rolling thin sheets, and simmering aromatic tomato sauce."),
    (55, "Recovering a Misplaced Backpack at the Central Station", "Filing lost property reports, identifying personal belongings, and expressing relief."),
    (56, "Navigating a Competitive Employment Interview", "Answering situational behavioral questions, articulating past experience, and sending thank-you notes."),
    (57, "Celebrating a Hard-Earned Workplace Promotion", "Gathering for celebratory dinner, thanking supportive mentors, and setting ambitious goals."),
    (58, "Navigating the Underground Subway System in an Unfamiliar Metropolis", "Deciphering colorful transit maps, buying contactless tickets, and changing transfer lines."),
    (59, "Assembling a Solid Pine Bookshelf from Raw Timber", "Measuring shelving distances, drilling pilot holes, sanding rough edges, and applying varnish."),
    (60, "Strategic Meal Planning and Balanced Nutrition for Busy Weeks", "Batch cooking brown rice, roasting seasonal root vegetables, and storing reusable glass containers."),
    (61, "A Fascinating Conversation with an International Exchange Student", "Comparing cultural traditions, linguistic idioms, holiday customs, and mutual perspectives."),
    (62, "Reflecting on an Intensive Summer Professional Internship", "Balancing supervisor deadlines, acquiring corporate software skills, and networking with colleagues."),
    (63, "Navigating Transportation Delays During Heavy Seasonal Downpours", "Sharing oversized umbrellas, waiting out thunderstorms in dry cafes, and remaining patient."),
    (64, "Cultivating Everyday Mindfulness Through Focused Breathing", "Sitting quietly for ten minutes each morning observing internal sensations without judgment."),
    (65, "Coordinating a Neighborhood Environmental Cleanup Initiative", "Distributing heavy duty trash bags, separating recyclables, and revitalizing community parklands."),
    (66, "Resolving an Online Retail Order Discrepancy Politely", "Contacting customer support, providing tracking invoices, and arranging an exchange courteously."),
    (67, "Attending an Intimate Acoustic Performance in an Historic Theater", "Listening to fingerstyle acoustic guitar melodies resonating under wooden acoustic arches."),
    (68, "Uncovering Forgotten Local History in the Municipal Archives", "Browsing century-old regional newspapers, sepia photographs, and historical cartography maps."),
    (69, "A Spontaneous Scenic Road Trip Along the Rugged Coastline", "Navigating ocean cliff bends, stopping at secluded pebble beaches, and watching sunsets."),
    (70, "Formulating Meaningful and Attainable New Year Resolutions", "Replacing vague ambitions with measurable milestones, habit tracking, and personal reflection.")
]

def generate_level2_sentences(num, title, desc):
    paragraphs = [
        f"In this intermediate dictation practice, we focus on the experience of {title.lower()}.",
        f"The situation involves {desc.lower()}",
        "Developing fluency at an intermediate level requires listening carefully to complex sentence constructions and varied verb tenses. As sentences become longer, paying attention to dependent clauses, relative pronouns, and transition words helps you keep track of the complete meaning.",
        "When people face new circumstances in life, they must adapt their routines and communicate effectively with those around them. Whether dealing with educational challenges, workplace obligations, or interpersonal relationships, clarity of expression is an essential life skill.",
        "Let us examine how the events unfolded throughout this memorable day. In the early morning hours, unexpected developments required quick thinking and proactive coordination. Rather than panicking, the individuals involved paused to assess the situation objectively.",
        "They discussed their options with open minds, weighing the potential advantages and drawbacks of each available course of action. 'If we divide the tasks fairly according to our strengths,' suggested one companion, 'we can resolve this matter much more efficiently.'",
        "Everyone nodded in agreement, recognizing the wisdom of collaborative effort. Over the next several hours, each participant focused intently on their specific responsibilities. Communication remained respectful and supportive, preventing misunderstandings before they could arise.",
        "As the afternoon progressed, tangible progress became clearly visible. What had initially seemed like a daunting obstacle was steadily transformed into a rewarding accomplishment. Overcoming practical difficulties together builds genuine self-confidence and deepens mutual trust.",
        "In our language practice, transcribing longer sentences trains both auditory comprehension and grammatical intuition. Notice how prepositions like throughout, beneath, toward, and regarding establish precise spatial and temporal relationships between ideas.",
        "Similarly, coordinating conjunctions like although, whereas, consequently, and nevertheless allow speakers to express nuanced viewpoints with sophistication. When you listen to spoken English, train yourself to anticipate these grammatical markers.",
        "By the time evening arrived, the team looked back on the day with a satisfying sense of shared fulfillment. They gathered around the kitchen table to unwind, enjoy a well-prepared meal, and reflect on the lessons learned along the way.",
        "Meaningful conversations flowed naturally as they shared personal anecdotes and laughed about earlier uncertainties. These everyday interactions remind us that learning extends far beyond textbooks and formal classrooms into every aspect of lived experience.",
        "Consistency is the secret to enduring mastery in any language journey. Each dictation session sharpens your acoustic discrimination and reinforces accurate spelling habits. As you review your work today, acknowledge your progress and look forward to tackling even more challenging texts tomorrow."
    ]

    extra_pool = [
        "Language learners often notice a significant leap in confidence when they master complex sentence rhythms.",
        "When listening to connected speech, native speakers frequently link consonant sounds to following vowels.",
        "Recognizing these natural phonological phenomena prevents confusion when hearing unfamiliar phrasing.",
        "Practicing with authentic situational narratives develops vocabulary that you can immediately apply in daily life.",
        "Take note of how modal verbs such as should, could, might, and ought to convey polite nuance in conversation.",
        "Clear articulation and deliberate pacing are far more persuasive than rushing through sentences hastily.",
        "Each word you accurately transcribe today brings you closer to effortless spontaneous comprehension.",
        "Maintain focus on accuracy, keep your posture upright, and embrace the satisfying rhythm of your keyboard."
    ]

    all_sentences = []
    for p in paragraphs:
        all_sentences.extend(split_into_sentences(p))
    all_sentences.extend(extra_pool)

    # Ensure sentence pool is large enough
    while sum(len(re.findall(r'\b[a-zA-Z0-9_\'-]+\b', s)) for s in all_sentences) < 1100:
        all_sentences.extend([
            f"We deepen our comprehension of {title.lower()} through deliberate auditory transcription.",
            "Attentive listening allows your working memory to hold multi-clause structures comfortably.",
            "Spelling nuances in the English language reward patient observation and regular practice.",
            "Reflect on the progress you have made since beginning this intermediate curriculum."
        ])

    return all_sentences

def generate_all_level2():
    manifests = []
    for num, title, desc in LEVEL_2_TOPICS:
        pool = generate_level2_sentences(num, title, desc)
        m = build_lesson(num, title, 2, "Intermediate", desc, pool)
        manifests.append(m)
        print(f"Generated Level 2 Lesson {num:02d}: {title} ({m['wordCount']} words, {m['sentenceCount']} sentences)")
    return manifests

if __name__ == '__main__':
    generate_all_level2()
