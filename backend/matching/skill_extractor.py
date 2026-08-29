from __future__ import annotations

import re
from typing import Dict, List, Optional, Set, Tuple

from .skill_normalizer import get_normalizer


_TECH_SKILLS = {
    # Languages
    "python", "javascript", "typescript", "java", "c#", "c++", "c", "go", "golang",
    "rust", "php", "ruby", "kotlin", "swift", "dart", "scala", "r", "matlab",
    "perl", "lua", "julia", "haskell", "elixir", "erlang", "clojure", "f#",
    "html", "css", "sql", "bash", "shell", "powershell", "assembly",

    # Frameworks & libraries
    "react", "angular", "vue.js", "vue", "next.js", "nextjs", "nuxt.js", "nuxtjs",
    "svelte", "jquery", "redux", "mobx", "ember", "backbone",
    "django", "flask", "fastapi", "uvicorn", "gunicorn", "celery", "tornado",
    "spring", "spring boot", "hibernate", "struts",
    "asp.net", "asp.net core", "blazor", "entity framework", "entity framework core",
    ".net", ".net core", ".net 5", ".net 6", ".net 7", ".net 8",
    "laravel", "symfony", "codeigniter",
    "ruby on rails", "sinatra",
    "express", "express.js", "nestjs", "fastify", "koa",
    "flutter", "react native", "ionic", "xamarin",

    # Databases
    "postgresql", "postgres", "mysql", "sql server", "sqlite", "mariadb",
    "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb",
    "cosmos db", "firestore", "neo4j", "couchdb", "couchbase",
    "influxdb", "timescaledb", "supabase", "planetscale",

    # Cloud & infrastructure
    "aws", "azure", "gcp", "google cloud",
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci", "travis ci",
    "argocd", "prometheus", "grafana", "datadog", "new relic",
    "cloudflare", "vercel", "netlify", "heroku", "digitalocean",

    # DevOps & tools
    "git", "github", "gitlab", "bitbucket",
    "nginx", "apache", "traefik", "haproxy", "caddy",
    "postman", "jira", "confluence", "notion", "figma",
    "vscode", "visual studio", "intellij", "pycharm", "webstorm",

    # Testing
    "jest", "mocha", "chai", "cypress", "playwright", "selenium",
    "junit", "testng", "xunit", "nunit", "mstest",
    "pytest", "unittest", "robot framework",
    "k6", "locust",

    # Data & ML
    "numpy", "pandas", "scipy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "matplotlib", "seaborn", "jupyter", "spark", "hadoop", "airflow", "dbt",
    "power bi", "tableau", "looker",

    # Message queues
    "rabbitmq", "kafka", "nats", "activemq",

    # APIs & protocols
    "rest", "graphql", "grpc", "websocket", "soap", "http", "https",
    "oauth", "oauth2", "jwt", "openapi", "swagger",

    # Methodologies
    "agile", "scrum", "kanban", "ci/cd", "devops", "tdd", "bdd",

    # Architecture
    "microservices", "serverless", "event-driven", "cqrs", "ddd", "solid",
    "mvc", "mvvm", "mvp",

    # Misc
    "linux", "ubuntu", "alpine", "macos", "windows",
    "machine learning", "deep learning", "nlp", "computer vision",
    "data science", "data engineering", "data analysis",
    "etl", "saas", "paas", "iaas",
    "full-stack", "fullstack", "frontend", "backend",
}

SPANISH_TECH_MAP = {
    "desarrollador": None,
    "programador": None,
    "analista": None,
    "ingeniero": None,
    "arquitecto": None,
    "líder técnico": None,
    "tech lead": None,
    "full stack": "Full-Stack",
    "frontend": "Frontend",
    "backend": "Backend",
    "base de datos": "Database",
    "nube": "Cloud",
    "servidor": "Server",
    "aplicación": "Application",
    "web": "Web",
    "móvil": "Mobile",
    "devops": "DevOps",
}

EXPERIENCE_LEVELS = {
    "junior": "junior",
    "júnior": "junior",
    "entry level": "junior",
    "entry-level": "junior",
    "trainee": "junior",
    "practicante": "junior",
    "intern": "junior",
    "becario": "junior",
    "mid": "mid",
    "mid-level": "mid",
    "intermediate": "mid",
    "intermedio": "mid",
    "semi senior": "mid",
    "semi-senior": "mid",
    "ssr": "mid",
    "mid-level": "mid",
    "senior": "senior",
    "sr": "senior",
    "sénior": "senior",
    "experienced": "senior",
    "advanced": "senior",
    "avanzado": "senior",
    "lead": "lead",
    "tech lead": "lead",
    "technical lead": "lead",
    "líder técnico": "lead",
    "principal": "lead",
    "staff": "lead",
    "architect": "lead",
    "arquitecto": "lead",
}


class SkillExtractor:
    def __init__(self):
        self._normalizer = get_normalizer()
        self._skill_pattern = re.compile(
            r'\b(?:' + '|'.join(re.escape(s) for s in sorted(_TECH_SKILLS, key=len, reverse=True)) + r')\b',
            re.IGNORECASE
        )

    def extract_from_text(self, text: str) -> List[str]:
        if not text:
            return []
        found = set()
        for match in self._skill_pattern.finditer(text):
            skill = self._normalizer.normalize(match.group(0))
            if skill:
                found.add(skill)
        return sorted(found)

    def extract_from_tags(self, tags: Optional[List[str]]) -> List[str]:
        if not tags:
            return []
        found = set()
        for tag in tags:
            normalized = self._normalizer.normalize(tag)
            if normalized:
                found.add(normalized)
        return sorted(found)

    def extract_required_vs_preferred(self, text: str) -> Tuple[List[str], List[str]]:
        if not text:
            return [], []
        required = set()
        preferred = set()
        text_lower = text.lower()

        required_markers = [
            "required", "must have", "must have", "essential", "necesario",
            "requisito", "obligatorio", "imprescindible",
        ]
        preferred_markers = [
            "nice to have", "preferred", "desired", "bonus", "plus",
            "deseable", "valorado", "diferenciador", "plus",
        ]

        lines = text.split('\n')
        current_context = None

        for line in lines:
            line_lower = line.lower().strip()

            for marker in required_markers:
                if marker in line_lower:
                    current_context = "required"
                    break
            for marker in preferred_markers:
                if marker in line_lower:
                    current_context = "preferred"
                    break

            skills = self.extract_from_text(line)
            if skills:
                if current_context == "required":
                    required.update(skills)
                elif current_context == "preferred":
                    preferred.update(skills)
                else:
                    required.update(skills)

        return sorted(required), sorted(preferred)

    def extract_seniority(self, title: str, description: Optional[str] = None) -> Optional[str]:
        combined = (title or "").lower()
        if description:
            combined += " " + description[:1000].lower()

        for marker, level in EXPERIENCE_LEVELS.items():
            if marker in combined:
                return level
        return None

    def extract_role_keywords(self, title: str) -> List[str]:
        if not title:
            return []
        keywords = set()
        title_lower = title.lower()
        for role_word in ["developer", "engineer", "architect", "lead", "manager",
                          "analyst", "designer", "consultant", "specialist",
                          "desarrollador", "ingeniero", "arquitecto", "analista",
                          "diseñador", "consultor", "especialista"]:
            if role_word in title_lower:
                keywords.add(role_word)
        tech_in_title = self.extract_from_text(title)
        keywords.update(tech_in_title)
        return sorted(keywords)


_extractor: Optional[SkillExtractor] = None


def get_extractor() -> SkillExtractor:
    global _extractor
    if _extractor is None:
        _extractor = SkillExtractor()
    return _extractor
