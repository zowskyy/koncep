#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="wonderlog_capture_roadmap"
PROJECT_DIR="$HOME/Desktop/$PROJECT_NAME"
ZIP_PATH="$HOME/Desktop/${PROJECT_NAME}.zip"

if ! command -v python3 >/dev/null 2>&1; then
    echo "Python 3 is required. Install Python 3, then run this script again."
    exit 1
fi

if [ -e "$PROJECT_DIR" ]; then
    echo "Folder already exists:"
    echo "  $PROJECT_DIR"
    echo
    echo "Rename or remove it first, then run this script again."
    exit 1
fi

mkdir -p "$PROJECT_DIR/templates"
mkdir -p "$PROJECT_DIR/static"
mkdir -p "$PROJECT_DIR/tests"

cat > "$PROJECT_DIR/requirements.txt" <<'EOF'
Flask==3.1.0
pytest==8.3.4
EOF

cat > "$PROJECT_DIR/README.md" <<'EOF'
# Wonderlog — Child-Facing Curiosity Capture Slice

A local-only Flask prototype for a three-step child-facing curiosity capture flow:

1. Pick a starting point.
2. Write a wonder in the child’s own words.
3. Review exact words, choose privacy, and save.

## Important

Use fictional data only.

This is a usability and design prototype, not a production system for real child data.

## Run

```bash
source .venv/bin/activate
pytest -q
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

The SQLite database is generated automatically as `wonderlog.db`.

## Prototype boundaries

- No cloud storage
- No accounts
- No AI
- No audio, images, notifications, analytics, or parent dashboard
- No real child data
- “Just me” is a product visibility label, not real device security
EOF

cat > "$PROJECT_DIR/IMPLEMENTATION_ROADMAP.md" <<'EOF'
# Wonderlog Implementation Roadmap

## Product purpose

Wonderlog is a local curiosity journal prototype. It helps a child capture:

- A question
- Something noticed
- An idea
- A changed mind

It is not a behavioral assessment tool, surveillance dashboard, therapy replacement, truth engine, or emergency service.

## Core rules

- Writing is not sharing.
- The child reviews exact words before final save.
- “Just me” is always selected by default.
- Sharing is per-entry and requires an active choice.
- “I’m still thinking” is a valid saved state.
- No AI interpretation, scoring, tags, streaks, or recommendations.
- Use fictional data only.

## Project map

```text
wonderlog_capture_roadmap/
├── app.py
├── requirements.txt
├── README.md
├── IMPLEMENTATION_ROADMAP.md
├── SECURITY_NOTES.md
├── static/
│   └── style.css
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── choose_capture.html
│   ├── capture.html
│   ├── confirm_capture.html
│   ├── capture_saved.html
│   ├── my_wonders.html
│   └── view_memory.html
└── tests/
    └── test_capture_flow.py
```

## Phase 0 — Baseline

```bash
source .venv/bin/activate
pytest -q
python app.py
```

Exit criteria:

- Tests pass
- App starts at `http://127.0.0.1:5000`
- Database is generated automatically
- No real child data is entered

## Phase 1 — Complete private capture

Validate only:

```text
Question → Write → Check → Just me → Save
```

Use fictional text:

```text
Why does the moon change shape?
```

Acceptance criteria:

- Child can select a question
- Step 2 repeats the choice
- Back preserves written text
- Step 3 shows exact text
- “Just me” is selected by default
- Final save is explicit

## Phase 2 — Still thinking

Validate:

```text
Idea → Write fragment → I’m still thinking → Saved
```

Expected storage:

```text
status = revisit
capture_state = draft
visibility = private
```

The child-facing UI must never describe the draft as “incomplete.”

## Phase 3 — Review

Validate:

- Saved wonders appear under “My wonders”
- Entries preserve original text
- Each entry visibly indicates “just me” or “shared”
- No child-facing edit or adult edit path exists yet

## Phase 4 — Fictional-data usability rehearsal

Ask:

- “What do you think this button does?”
- “Who can see this?”
- “Can you change your words before saving?”
- “What happens if you are still thinking?”

Watch for:

| Signal | Likely correction |
|---|---|
| Child thinks Next saves | Make final save exclusive to Step 3 |
| Child thinks sharing is required | Keep private first and selected |
| Child cannot name the adult | Show name and relationship |
| Child avoids draft action | Keep “I’m still thinking” language |
| Text is lost on Back | Add or repair regression test |

## Phase 5 — Before real data

Do not collect real child writing until all of this is complete:

- Local/device authentication
- Encrypted database and key management
- Server-side or otherwise security-reviewed session strategy
- CSRF protection
- Per-entry sharing grants and revocation
- Access logs
- Export and deletion
- Encrypted backups
- Guardian consent and child assent design
- Threat model for shared devices and browser history
- Safeguarding and emergency-boundary policy
- Legal, privacy, accessibility, and child-safety review

## Development loop

For each change:

1. Plan the child-facing behavior and privacy effect
2. Slice one route, template, data field, or component
3. Add or update a test
4. Run `pytest -q`
5. Audit copy, defaults, accessibility, persistence, and privacy
6. Repeat using observed confusion, not assumptions
EOF

cat > "$PROJECT_DIR/SECURITY_NOTES.md" <<'EOF'
# Security and Privacy Notes

## Prototype status

This is a local fictional-data prototype.

It is not appropriate for real child data.

## Current limitations

- SQLite is not encrypted.
- Flask development server is not a production server.
- Flask’s default session is signed but not encrypted.
- No accounts or device authentication exist.
- No guardian consent or child assent flow exists.
- No session expiration exists.
- No sharing authorization or revocation workflow exists.
- No export, deletion verification, backups, or audit logs exist.
- “Just me” does not prevent access by another person using the same unlocked device or browser profile.
- The trusted-adult name is fixture data only.

## Extension rules

- Never hardcode a production secret key.
- Add CSRF protection before exposing mutating routes beyond local testing.
- Never log entry text, drafts, form bodies, or database records.
- Do not add analytics, trackers, external fonts, or third-party scripts.
- Do not add cloud sync, audio, photos, AI, or parent dashboards without a formal safety and privacy review.
- Do not claim that a feature is private unless the device, storage, and access controls actually enforce it.
EOF

cat > "$PROJECT_DIR/app.py" <<'EOF'
from datetime import datetime, timezone
from pathlib import Path
import os
import sqlite3

from flask import (
    Flask,
    abort,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "wonderlog.db"

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get(
        "WONDERLOG_SECRET_KEY",
        "local-fictional-data-only",
    ),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

CAPTURE_TYPES = {
    "question": {
        "storage_kind": "question",
        "icon": "?",
        "label": "A question",
        "prompt": "What are you wondering?",
        "placeholder": "I wonder why...",
        "helper": "You could write what made you start wondering.",
    },
    "notice": {
        "storage_kind": "observation",
        "icon": "👀",
        "label": "I noticed something",
        "prompt": "What did you notice?",
        "placeholder": "I noticed...",
        "helper": "You could write what happened or what you saw.",
    },
    "idea": {
        "storage_kind": "belief",
        "icon": "💡",
        "label": "An idea",
        "prompt": "What is your idea right now?",
        "placeholder": "I think maybe...",
        "helper": "An idea can change later. That is okay.",
    },
    "looking_back": {
        "storage_kind": "reflection",
        "icon": "↩",
        "label": "Looking back",
        "prompt": "What do you think differently now?",
        "placeholder": "Before I thought..., but now...",
        "helper": "You can write about something that helped your thinking change.",
    },
}

TRUSTED_ADULT = {
    "name": "Maya",
    "relationship": "Your aunt",
}


def utc_timestamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with get_db() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL CHECK (
                    kind IN ('question', 'belief', 'observation', 'reflection')
                ),
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open' CHECK (
                    status IN ('open', 'resolved', 'revisit', 'archived')
                ),
                visibility TEXT NOT NULL DEFAULT 'private' CHECK (
                    visibility IN ('private', 'shared')
                ),
                shared_with_name TEXT,
                capture_state TEXT NOT NULL DEFAULT 'complete' CHECK (
                    capture_state IN ('draft', 'complete')
                ),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_memories_created_at
            ON memories(created_at DESC)
            """
        )


def get_memory(memory_id):
    with get_db() as connection:
        memory = connection.execute(
            "SELECT * FROM memories WHERE id = ?",
            (memory_id,),
        ).fetchone()

    if memory is None:
        abort(404)

    return memory


def get_capture_draft():
    draft = session.get("capture_draft")

    if not draft:
        return None

    if draft.get("kind") not in CAPTURE_TYPES:
        session.pop("capture_draft", None)
        return None

    return draft


def make_title(content):
    normalized = " ".join(content.split())

    if len(normalized) <= 72:
        return normalized

    return normalized[:69].rstrip() + "..."


@app.template_filter("pretty_date")
def pretty_date(value):
    if not value:
        return ""

    try:
        date = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
        return date.strftime("%B %d, %Y")
    except ValueError:
        return value


@app.route("/")
def index():
    with get_db() as connection:
        recent = connection.execute(
            """
            SELECT *
            FROM memories
            ORDER BY created_at DESC
            LIMIT 6
            """
        ).fetchall()

    return render_template("index.html", recent=recent)


@app.route("/wonders")
def my_wonders():
    with get_db() as connection:
        memories = connection.execute(
            """
            SELECT *
            FROM memories
            ORDER BY created_at DESC
            """
        ).fetchall()

    return render_template("my_wonders.html", memories=memories)


@app.route("/wonder/<int:memory_id>")
def view_memory(memory_id):
    return render_template(
        "view_memory.html",
        memory=get_memory(memory_id),
    )


@app.route("/new", methods=["GET", "POST"])
def choose_capture():
    if request.method == "POST":
        kind = request.form.get("kind", "").strip()

        if kind not in CAPTURE_TYPES:
            flash("Choose one way to start your wonder.", "error")
            return render_template(
                "choose_capture.html",
                capture_types=CAPTURE_TYPES,
            )

        existing = get_capture_draft() or {}

        session["capture_draft"] = {
            "kind": kind,
            "content": existing.get("content", ""),
            "started_at": existing.get("started_at", utc_timestamp()),
        }
        session.modified = True

        return redirect(url_for("write_capture"))

    return render_template(
        "choose_capture.html",
        capture_types=CAPTURE_TYPES,
    )


@app.route("/new/write", methods=["GET", "POST"])
def write_capture():
    draft = get_capture_draft()

    if draft is None:
        return redirect(url_for("choose_capture"))

    capture = CAPTURE_TYPES[draft["kind"]]

    if request.method == "POST":
        content = request.form.get("content", "").strip()
        action = request.form.get("action", "").strip()

        draft["content"] = content
        session["capture_draft"] = draft
        session.modified = True

        if action == "save_draft":
            if not content:
                flash(
                    "Write a few words, or go back when you are ready.",
                    "error",
                )
                return render_template(
                    "capture.html",
                    capture=capture,
                    draft=draft,
                )

            timestamp = utc_timestamp()

            with get_db() as connection:
                cursor = connection.execute(
                    """
                    INSERT INTO memories (
                        kind,
                        title,
                        content,
                        status,
                        visibility,
                        capture_state,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        capture["storage_kind"],
                        make_title(content),
                        content,
                        "revisit",
                        "private",
                        "draft",
                        timestamp,
                        timestamp,
                    ),
                )
                memory_id = cursor.lastrowid

            session.pop("capture_draft", None)

            return redirect(
                url_for("capture_saved", memory_id=memory_id)
            )

        if action != "next":
            flash("Choose what you would like to do next.", "error")
            return render_template(
                "capture.html",
                capture=capture,
                draft=draft,
            )

        if not content:
            flash(
                "Write a few words, or choose ‘I’m still thinking.’",
                "error",
            )
            return render_template(
                "capture.html",
                capture=capture,
                draft=draft,
            )

        return redirect(url_for("check_capture"))

    return render_template(
        "capture.html",
        capture=capture,
        draft=draft,
    )


@app.route("/new/check", methods=["GET", "POST"])
def check_capture():
    draft = get_capture_draft()

    if draft is None or not draft.get("content", "").strip():
        return redirect(url_for("choose_capture"))

    capture = CAPTURE_TYPES[draft["kind"]]

    if request.method == "POST":
        visibility = request.form.get(
            "visibility",
            "private",
        ).strip()

        if visibility not in {"private", "shared"}:
            flash("Choose who can see this wonder.", "error")
            return render_template(
                "confirm_capture.html",
                capture=capture,
                draft=draft,
                trusted_adult=TRUSTED_ADULT,
            )

        content = draft["content"].strip()
        timestamp = utc_timestamp()

        shared_with_name = (
            TRUSTED_ADULT["name"]
            if visibility == "shared"
            else None
        )

        with get_db() as connection:
            cursor = connection.execute(
                """
                INSERT INTO memories (
                    kind,
                    title,
                    content,
                    status,
                    visibility,
                    shared_with_name,
                    capture_state,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    capture["storage_kind"],
                    make_title(content),
                    content,
                    "open",
                    visibility,
                    shared_with_name,
                    "complete",
                    timestamp,
                    timestamp,
                ),
            )
            memory_id = cursor.lastrowid

        session.pop("capture_draft", None)

        return redirect(
            url_for("capture_saved", memory_id=memory_id)
        )

    return render_template(
        "confirm_capture.html",
        capture=capture,
        draft=draft,
        trusted_adult=TRUSTED_ADULT,
    )


@app.route("/new/saved/<int:memory_id>")
def capture_saved(memory_id):
    return render_template(
        "capture_saved.html",
        memory=get_memory(memory_id),
    )


@app.route("/new/cancel", methods=["POST"])
def cancel_capture():
    session.pop("capture_draft", None)
    flash("Your unsaved wonder was not kept.", "success")
    return redirect(url_for("index"))


initialize_database()

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
EOF

cat > "$PROJECT_DIR/templates/base.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}Wonderlog{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
    <header class="site-header">
        <div class="header-inner">
            <a class="brand" href="{{ url_for('index') }}">
                <span class="brand-mark">W</span>
                <span>Wonderlog</span>
            </a>

            <nav aria-label="Main navigation">
                <a href="{{ url_for('index') }}">Home</a>
                <a href="{{ url_for('my_wonders') }}">My wonders</a>
                <a class="button small" href="{{ url_for('choose_capture') }}">
                    Add a wonder
                </a>
            </nav>
        </div>
    </header>

    <main class="container">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% for category, message in messages %}
                <div class="flash {{ category }}" role="status">
                    {{ message }}
                </div>
            {% endfor %}
        {% endwith %}

        {% block content %}{% endblock %}
    </main>

    <footer class="site-footer">
        <p>Local fictional-data prototype. Do not use with real child data.</p>
    </footer>
</body>
</html>
EOF

cat > "$PROJECT_DIR/templates/index.html" <<'EOF'
{% extends "base.html" %}

{% block title %}Wonderlog — Home{% endblock %}

{% block content %}
<section class="hero">
    <div>
        <p class="eyebrow">A place for wondering</p>
        <h1>Give your thoughts a place to rest.</h1>
        <p class="hero-text">
            Save a question, something you noticed, an idea,
            or a thought you want to revisit later.
        </p>
        <a class="button" href="{{ url_for('choose_capture') }}">
            Add a wonder
        </a>
    </div>

    <div class="hero-card" aria-hidden="true">
        <span class="large-symbol">?</span>
        <p>It is okay not to know yet.</p>
    </div>
</section>

<section class="section-heading">
    <div>
        <p class="eyebrow">Recent</p>
        <h2>My latest wonders</h2>
    </div>
    <a class="text-link" href="{{ url_for('my_wonders') }}">
        See all →
    </a>
</section>

{% if recent %}
<div class="memory-list">
    {% for memory in recent %}
    <article class="memory-card">
        <div class="memory-card-top">
            <span class="tag {{ memory['kind'] }}">
                {{ memory['kind'] }}
            </span>

            <span class="privacy-badge">
                {% if memory['visibility'] == 'shared' %}
                    shared
                {% else %}
                    just me
                {% endif %}
            </span>
        </div>

        <h3>
            <a href="{{ url_for('view_memory', memory_id=memory['id']) }}">
                {{ memory['title'] }}
            </a>
        </h3>

        <p>{{ memory['content']|truncate(170) }}</p>
        <div class="memory-meta">
            {{ memory['created_at']|pretty_date }}
        </div>
    </article>
    {% endfor %}
</div>
{% else %}
<div class="empty-state">
    <h3>Nothing is saved yet.</h3>
    <p>A question, a notice, or an idea can begin your wonder shelf.</p>
    <a class="button" href="{{ url_for('choose_capture') }}">
        Add a wonder
    </a>
</div>
{% endif %}
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/choose_capture.html" <<'EOF'
{% extends "base.html" %}

{% block title %}Add a wonder — Wonderlog{% endblock %}

{% block content %}
<section class="choose-page">
    <div class="capture-topbar">
        <a class="back-link" href="{{ url_for('index') }}">← Home</a>
        <span class="step-label">Step 1 of 3</span>
    </div>

    <div class="choose-intro">
        <p class="eyebrow">A new wonder</p>
        <h1>What is on your mind today?</h1>
        <p>Pick the one that feels closest.</p>
    </div>

    <form method="post" class="choice-grid">
        {% for key, capture in capture_types.items() %}
        <button class="choice-card" type="submit" name="kind" value="{{ key }}">
            <span class="choice-icon" aria-hidden="true">
                {{ capture.icon }}
            </span>
            <span class="choice-label">{{ capture.label }}</span>
            <span class="choice-prompt">{{ capture.prompt }}</span>
        </button>
        {% endfor %}
    </form>

    <form method="post" action="{{ url_for('cancel_capture') }}" class="quiet-exit">
        <button class="text-button" type="submit">Not now</button>
    </form>
</section>
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/capture.html" <<'EOF'
{% extends "base.html" %}

{% block title %}Write your wonder — Wonderlog{% endblock %}

{% block content %}
<section class="capture-page">
    <div class="capture-topbar">
        <a class="back-link" href="{{ url_for('choose_capture') }}">← Back</a>
        <span class="step-label">Step 2 of 3</span>
    </div>

    <form method="post" class="capture-card">
        <div class="capture-kind">
            <span class="capture-icon" aria-hidden="true">
                {{ capture.icon }}
            </span>
            <span>{{ capture.label }}</span>
        </div>

        <h1>{{ capture.prompt }}</h1>
        <p class="capture-intro">You can write a little or a lot.</p>

        <label for="content">{{ capture.prompt }}</label>
        <textarea
            id="content"
            name="content"
            rows="8"
            maxlength="2000"
            placeholder="{{ capture.placeholder }}"
        >{{ draft.content }}</textarea>

        <details class="capture-help">
            <summary>Need an idea?</summary>
            <p>{{ capture.helper }}</p>
        </details>

        <div class="capture-actions">
            <button
                class="text-button"
                type="submit"
                name="action"
                value="save_draft"
            >
                I’m still thinking
            </button>

            <button
                class="button"
                type="submit"
                name="action"
                value="next"
            >
                Next →
            </button>
        </div>
    </form>
</section>
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/confirm_capture.html" <<'EOF'
{% extends "base.html" %}

{% block title %}Check your wonder — Wonderlog{% endblock %}

{% block content %}
<section class="confirm-page">
    <div class="capture-topbar">
        <a class="back-link" href="{{ url_for('write_capture') }}">← Back</a>
        <span class="step-label">Step 3 of 3</span>
    </div>

    <form method="post" class="confirm-card">
        <p class="eyebrow">Check your wonder</p>
        <h1>Is this how you want to save it?</h1>

        <section class="entry-preview" aria-labelledby="preview-heading">
            <p id="preview-heading" class="preview-label">You wrote:</p>
            <p class="preview-content">{{ draft.content }}</p>
        </section>

        <a class="text-link" href="{{ url_for('write_capture') }}">
            Edit my words
        </a>

        <fieldset class="visibility-options">
            <legend>Who can see this?</legend>

            <label class="visibility-option">
                <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked
                >

                <span class="visibility-icon" aria-hidden="true">🔒</span>

                <span class="visibility-copy">
                    <strong>Just me</strong>
                    <small>Only you can open it on this device.</small>
                </span>
            </label>

            <label class="visibility-option">
                <input
                    type="radio"
                    name="visibility"
                    value="shared"
                >

                <span class="visibility-icon" aria-hidden="true">🤝</span>

                <span class="visibility-copy">
                    <strong>Share with {{ trusted_adult.name }}</strong>
                    <small>
                        {{ trusted_adult.relationship }} can read it with you.
                    </small>
                </span>
            </label>
        </fieldset>

        <p class="privacy-note">You can change this later.</p>

        <div class="confirm-actions">
            <a class="button secondary" href="{{ url_for('write_capture') }}">
                Edit my words
            </a>

            <button class="button" type="submit">Save my wonder</button>
        </div>
    </form>
</section>
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/capture_saved.html" <<'EOF'
{% extends "base.html" %}

{% block title %}Wonder saved — Wonderlog{% endblock %}

{% block content %}
<section class="saved-page">
    <div class="saved-card">
        <span class="saved-icon" aria-hidden="true">✓</span>
        <p class="eyebrow">Saved</p>

        {% if memory['capture_state'] == 'draft' %}
            <h1>Your unfinished wonder is saved.</h1>
        {% else %}
            <h1>Your wonder has a place to rest.</h1>
        {% endif %}

        <blockquote class="saved-preview">
            {{ memory['content'] }}
        </blockquote>

        {% if memory['visibility'] == 'shared' %}
            <p class="saved-privacy">
                {{ memory['shared_with_name'] }} can read it with you.
                You can change this later.
            </p>
        {% else %}
            <p class="saved-privacy">
                It is marked just for you in this prototype.
            </p>
        {% endif %}

        <div class="saved-actions">
            <a class="button secondary" href="{{ url_for('my_wonders') }}">
                See my wonders
            </a>
            <a class="button" href="{{ url_for('choose_capture') }}">
                Add another
            </a>
        </div>

        <a class="done-link" href="{{ url_for('index') }}">I’m done</a>
    </div>
</section>
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/my_wonders.html" <<'EOF'
{% extends "base.html" %}

{% block title %}My wonders — Wonderlog{% endblock %}

{% block content %}
<section class="section-heading">
    <div>
        <p class="eyebrow">My shelf</p>
        <h1>My wonders</h1>
    </div>

    <a class="button small" href="{{ url_for('choose_capture') }}">
        Add a wonder
    </a>
</section>

{% if memories %}
<div class="memory-list">
    {% for memory in memories %}
    <article class="memory-card">
        <div class="memory-card-top">
            <span class="tag {{ memory['kind'] }}">
                {{ memory['kind'] }}
            </span>

            <span class="privacy-badge">
                {% if memory['visibility'] == 'shared' %}
                    shared
                {% else %}
                    just me
                {% endif %}
            </span>
        </div>

        <h3>
            <a href="{{ url_for('view_memory', memory_id=memory['id']) }}">
                {{ memory['title'] }}
            </a>
        </h3>

        <p>{{ memory['content']|truncate(220) }}</p>

        <div class="memory-meta">
            {{ memory['created_at']|pretty_date }}
            ·
            {% if memory['status'] == 'revisit' %}
                come back later
            {% else %}
                still wondering
            {% endif %}
        </div>
    </article>
    {% endfor %}
</div>
{% else %}
<div class="empty-state">
    <h3>Your wonder shelf is empty.</h3>
    <p>A question, notice, or idea can go here.</p>
    <a class="button" href="{{ url_for('choose_capture') }}">
        Add a wonder
    </a>
</div>
{% endif %}
{% endblock %}
EOF

cat > "$PROJECT_DIR/templates/view_memory.html" <<'EOF'
{% extends "base.html" %}

{% block title %}A wonder — Wonderlog{% endblock %}

{% block content %}
<section class="view-page">
    <a class="back-link" href="{{ url_for('my_wonders') }}">
        ← My wonders
    </a>

    <article class="view-card">
        <div class="memory-card-top">
            <span class="tag {{ memory['kind'] }}">
                {{ memory['kind'] }}
            </span>

            <span class="privacy-badge">
                {% if memory['visibility'] == 'shared' %}
                    shared with {{ memory['shared_with_name'] }}
                {% else %}
                    just me
                {% endif %}
            </span>
        </div>

        <h1>{{ memory['title'] }}</h1>
        <p class="view-content">{{ memory['content'] }}</p>

        <p class="memory-meta">
            Saved {{ memory['created_at']|pretty_date }}
        </p>

        {% if memory['capture_state'] == 'draft' %}
        <div class="note-box">
            <strong>Come back later:</strong>
            You saved this while you were still thinking.
        </div>
        {% endif %}

        <div class="prototype-note">
            This prototype intentionally does not edit, share, or delete child-facing
            entries yet. Add those paths only after building revision history and safe,
            explicit permission controls.
        </div>
    </article>
</section>
{% endblock %}
EOF

cat > "$PROJECT_DIR/static/style.css" <<'EOF'
:root {
    --background: #f7f5f0;
    --surface: #ffffff;
    --surface-soft: #f0eee8;
    --text: #292821;
    --muted: #6e6a61;
    --line: #dedbd1;
    --primary: #5c674d;
    --primary-dark: #46503b;
    --accent: #d98655;
    --focus: rgba(92, 103, 77, 0.22);
    --shadow: 0 12px 35px rgba(49, 43, 31, 0.08);
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: var(--background);
    color: var(--text);
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.6;
}

a {
    color: inherit;
}

.site-header {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
}

.header-inner {
    max-width: 1120px;
    min-height: 72px;
    padding: 0 24px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.3rem;
    font-weight: bold;
    text-decoration: none;
}

.brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    display: grid;
    place-items: center;
    font-family: Arial, sans-serif;
}

nav {
    display: flex;
    align-items: center;
    gap: 18px;
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
}

nav a {
    text-decoration: none;
}

nav a:not(.button):hover,
.text-link:hover,
.back-link:hover,
.done-link:hover {
    color: var(--accent);
}

.container {
    max-width: 1120px;
    padding: 55px 24px 90px;
    margin: 0 auto;
}

.hero {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    align-items: center;
    gap: 60px;
    margin-bottom: 58px;
}

.eyebrow {
    margin: 0 0 8px;
    color: var(--accent);
    font-family: Arial, sans-serif;
    font-size: 0.76rem;
    font-weight: bold;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

h1,
h2,
h3 {
    margin-top: 0;
    line-height: 1.15;
}

h1 {
    margin-bottom: 18px;
    font-size: clamp(2.3rem, 6vw, 4.7rem);
    font-weight: normal;
}

h2 {
    font-size: 2rem;
    font-weight: normal;
}

h3 {
    margin-bottom: 10px;
    font-size: 1.3rem;
}

.hero-text {
    max-width: 620px;
    margin-bottom: 28px;
    color: var(--muted);
    font-size: 1.15rem;
}

.hero-card {
    min-height: 260px;
    padding: 42px;
    background: #e8e5d8;
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    transform: rotate(2deg);
}

.large-symbol {
    color: var(--primary);
    font-size: 7rem;
    line-height: 1;
}

.hero-card p {
    max-width: 210px;
    font-size: 1.15rem;
}

.button {
    display: inline-block;
    padding: 12px 18px;
    border: 0;
    border-radius: 8px;
    background: var(--primary);
    color: white;
    cursor: pointer;
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: bold;
    text-decoration: none;
}

.button:hover {
    background: var(--primary-dark);
}

.button.small {
    padding: 8px 12px;
}

.button.secondary {
    background: var(--surface-soft);
    color: var(--text);
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
}

.section-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    margin-bottom: 22px;
}

.section-heading h1,
.section-heading h2 {
    margin-bottom: 0;
}

.text-link {
    color: var(--primary);
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
    text-decoration: none;
}

.memory-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.memory-card,
.empty-state,
.view-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow);
}

.memory-card {
    padding: 24px;
}

.memory-card h3 a {
    text-decoration: none;
}

.memory-card h3 a:hover {
    color: var(--accent);
}

.memory-card p {
    color: #57544c;
}

.memory-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
}

.tag,
.privacy-badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-family: Arial, sans-serif;
    font-size: 0.7rem;
    font-weight: bold;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.tag {
    background: #e7eee1;
    color: var(--primary-dark);
}

.tag.belief {
    background: #f5e4d8;
    color: #9c5d36;
}

.tag.observation {
    background: #e3e9f1;
    color: #49617e;
}

.tag.reflection {
    background: #eee3f1;
    color: #75547c;
}

.privacy-badge {
    background: var(--surface-soft);
    color: var(--muted);
}

.memory-meta {
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 0.78rem;
}

.empty-state {
    padding: 45px;
    text-align: center;
}

.empty-state h3 {
    margin-bottom: 8px;
}

.empty-state p {
    margin-bottom: 24px;
    color: var(--muted);
}

.choose-page,
.capture-page,
.confirm-page,
.saved-page,
.view-page {
    max-width: 760px;
    margin: 0 auto;
}

.capture-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
}

.back-link,
.step-label,
.done-link {
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
}

.back-link,
.done-link {
    text-decoration: none;
}

.choose-intro {
    margin-bottom: 28px;
}

.choose-intro h1,
.capture-card h1,
.confirm-card h1,
.saved-card h1 {
    font-size: clamp(2rem, 5vw, 3.3rem);
}

.choose-intro p:last-child,
.capture-intro {
    color: var(--muted);
    font-size: 1.05rem;
}

.choice-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}

.choice-card {
    min-height: 175px;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--text);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    transition: border-color 150ms ease, transform 150ms ease;
}

.choice-card:hover,
.choice-card:focus-visible {
    border-color: var(--primary);
    transform: translateY(-2px);
}

.choice-icon,
.capture-icon,
.saved-icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: #f9ead2;
    font-family: Arial, sans-serif;
}

.choice-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    font-size: 1.5rem;
}

.choice-label {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    font-weight: bold;
}

.choice-prompt {
    margin-top: 6px;
    color: var(--muted);
    font-size: 0.9rem;
}

.quiet-exit {
    margin-top: 25px;
    text-align: center;
}

.capture-card,
.confirm-card,
.saved-card {
    padding: clamp(24px, 5vw, 42px);
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
}

.capture-kind {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--primary-dark);
    font-family: Arial, sans-serif;
    font-size: 0.8rem;
    font-weight: bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.capture-icon {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
}

.capture-card h1 {
    margin: 22px 0 8px;
}

label {
    display: block;
    margin: 20px 0 8px;
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: bold;
}

textarea {
    width: 100%;
    min-height: 220px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fffefa;
    color: var(--text);
    font: inherit;
    font-size: 1.1rem;
    line-height: 1.65;
    resize: vertical;
}

textarea:focus {
    border-color: var(--primary);
    outline: 3px solid var(--focus);
}

.capture-help {
    margin-top: 16px;
    padding: 12px 15px;
    border-radius: 10px;
    background: #f5f2e9;
    color: #5d584d;
}

.capture-help summary {
    cursor: pointer;
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: bold;
}

.capture-actions,
.confirm-actions,
.saved-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 28px;
}

.text-button {
    padding: 8px 0;
    border: 0;
    background: transparent;
    color: var(--primary);
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
}

.entry-preview {
    margin: 26px 0 16px;
    padding: 18px;
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    background: #f8f6f0;
}

.preview-label {
    margin: 0 0 8px;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 0.82rem;
    font-weight: bold;
    text-transform: uppercase;
}

.preview-content {
    margin: 0;
    font-size: 1.15rem;
    white-space: pre-wrap;
}

.visibility-options {
    margin: 32px 0 0;
    padding: 0;
    border: 0;
}

.visibility-options legend {
    margin-bottom: 12px;
    font-family: Arial, sans-serif;
    font-size: 1rem;
    font-weight: bold;
}

.visibility-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    cursor: pointer;
}

.visibility-option:has(input:checked) {
    border-color: var(--primary);
    background: #f1f5ed;
}

.visibility-option input {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    margin: 2px 0 0;
    accent-color: var(--primary);
}

.visibility-icon {
    font-size: 1.2rem;
    line-height: 1.3;
}

.visibility-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.visibility-copy strong {
    font-family: Arial, sans-serif;
}

.visibility-copy small,
.privacy-note,
.saved-privacy {
    color: var(--muted);
    font-size: 0.9rem;
}

.privacy-note {
    margin: 14px 0 0;
}

.saved-page {
    min-height: 58vh;
    display: grid;
    place-items: center;
}

.saved-card {
    max-width: 650px;
    text-align: center;
}

.saved-icon {
    width: 62px;
    height: 62px;
    background: #e2efde;
    color: #486746;
    font-size: 1.7rem;
}

.saved-preview {
    margin: 24px 0;
    padding: 18px;
    border-left: 4px solid var(--accent);
    background: #f8f6f0;
    font-size: 1.1rem;
    text-align: left;
    white-space: pre-wrap;
}

.done-link {
    display: inline-block;
    margin-top: 22px;
}

.view-card {
    margin-top: 22px;
    padding: clamp(24px, 5vw, 42px);
}

.view-card h1 {
    font-size: clamp(2rem, 5vw, 3.3rem);
}

.view-content {
    font-size: 1.2rem;
    white-space: pre-wrap;
}

.note-box,
.prototype-note {
    margin-top: 24px;
    padding: 12px 15px;
    border-left: 4px solid var(--accent);
    background: #f5f2e9;
    color: #5d584d;
}

.prototype-note {
    font-family: Arial, sans-serif;
    font-size: 0.85rem;
}

.flash {
    margin-bottom: 22px;
    padding: 12px 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
}

.flash.success {
    background: #e5f1e2;
    color: #476244;
}

.flash.error {
    background: #f8e2e2;
    color: #8b3e3e;
}

.site-footer {
    padding: 25px 24px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 0.78rem;
    text-align: center;
}

@media (max-width: 760px) {
    .header-inner {
        flex-direction: column;
        align-items: flex-start;
        padding-top: 17px;
        padding-bottom: 17px;
    }

    nav {
        flex-wrap: wrap;
    }

    .container {
        padding-top: 35px;
    }

    .hero {
        grid-template-columns: 1fr;
        gap: 25px;
    }

    .hero-card {
        min-height: 190px;
    }

    .memory-list,
    .choice-grid {
        grid-template-columns: 1fr;
    }

    .section-heading {
        flex-direction: column;
        align-items: flex-start;
    }

    .capture-actions,
    .confirm-actions,
    .saved-actions {
        flex-direction: column-reverse;
        align-items: stretch;
    }

    .capture-actions .button,
    .confirm-actions .button,
    .saved-actions .button,
    .capture-actions .text-button {
        text-align: center;
    }
}
EOF

cat > "$PROJECT_DIR/tests/test_capture_flow.py" <<'EOF'
import pytest

import app as wonderlog_app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    test_database = tmp_path / "wonderlog-test.db"

    monkeypatch.setattr(wonderlog_app, "DATABASE", test_database)

    wonderlog_app.app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
    )

    wonderlog_app.initialize_database()

    with wonderlog_app.app.test_client() as test_client:
        yield test_client


def test_home_page_loads(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Give your thoughts a place to rest." in response.data


def test_child_can_choose_question_and_reach_write_screen(client):
    response = client.post(
        "/new",
        data={"kind": "question"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert b"What are you wondering?" in response.data
    assert b"Step 2 of 3" in response.data


def test_invalid_capture_type_is_rejected(client):
    response = client.post(
        "/new",
        data={"kind": "not-real"},
        follow_redirects=True,
    )

    assert b"Choose one way to start your wonder." in response.data


def test_empty_content_stays_on_write_screen(client):
    client.post("/new", data={"kind": "question"})

    response = client.post(
        "/new/write",
        data={"content": "", "action": "next"},
        follow_redirects=True,
    )

    assert b"Write a few words" in response.data
    assert b"Step 2 of 3" in response.data


def test_text_is_preserved_when_returning_to_step_two(client):
    client.post("/new", data={"kind": "question"})

    client.post(
        "/new/write",
        data={
            "content": "Why do cats sleep so much?",
            "action": "next",
        },
    )

    response = client.get("/new/write")

    assert b"Why do cats sleep so much?" in response.data


def test_child_can_review_before_saving(client):
    client.post("/new", data={"kind": "question"})

    response = client.post(
        "/new/write",
        data={
            "content": "Why do cats sleep so much?",
            "action": "next",
        },
        follow_redirects=True,
    )

    assert b"Step 3 of 3" in response.data
    assert b"Why do cats sleep so much?" in response.data
    assert b"Just me" in response.data


def test_private_is_the_default_visibility(client):
    client.post("/new", data={"kind": "question"})

    client.post(
        "/new/write",
        data={
            "content": "Why do cats sleep so much?",
            "action": "next",
        },
    )

    response = client.get("/new/check")

    assert b'value="private"' in response.data
    assert b"checked" in response.data


def test_child_can_save_a_private_wonder(client):
    client.post("/new", data={"kind": "question"})

    client.post(
        "/new/write",
        data={
            "content": "Why do cats sleep so much?",
            "action": "next",
        },
    )

    response = client.post(
        "/new/check",
        data={"visibility": "private"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert b"Your wonder has a place to rest." in response.data
    assert b"just for you" in response.data


def test_child_can_save_an_unfinished_private_draft(client):
    client.post("/new", data={"kind": "idea"})

    response = client.post(
        "/new/write",
        data={
            "content": "I think clouds might be soft.",
            "action": "save_draft",
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert b"Your unfinished wonder is saved." in response.data


def test_shared_entry_names_the_fixture_adult(client):
    client.post("/new", data={"kind": "notice"})

    client.post(
        "/new/write",
        data={
            "content": "I noticed rain sounds loud on the roof.",
            "action": "next",
        },
    )

    response = client.post(
        "/new/check",
        data={"visibility": "shared"},
        follow_redirects=True,
    )

    assert b"Maya can read it with you." in response.data
EOF

echo
echo "Creating virtual environment..."
python3 -m venv "$PROJECT_DIR/.venv"

echo "Installing dependencies..."
"$PROJECT_DIR/.venv/bin/python" -m pip install --upgrade pip
"$PROJECT_DIR/.venv/bin/python" -m pip install -r "$PROJECT_DIR/requirements.txt"

echo "Running tests..."
(
    cd "$PROJECT_DIR"
    "$PROJECT_DIR/.venv/bin/python" -m pytest -q
)

echo "Creating ZIP archive..."
if command -v ditto >/dev/null 2>&1; then
    ditto -c -k --sequesterRsrc --keepParent "$PROJECT_DIR" "$ZIP_PATH"
else
    (
        cd "$HOME/Desktop"
        zip -r "${PROJECT_NAME}.zip" "$PROJECT_NAME" >/dev/null
    )
fi

echo
echo "Success."
echo
echo "Project folder:"
echo "  $PROJECT_DIR"
echo
echo "ZIP archive:"
echo "  $ZIP_PATH"
echo
echo "Start the app:"
echo "  cd \"$PROJECT_DIR\""
echo "  source .venv/bin/activate"
echo "  python app.py"
echo
echo "Then open:"
echo "  http://127.0.0.1:5000"