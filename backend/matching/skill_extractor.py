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
    "groovy", "zig", "nim", "ocaml", "crystal", "mojo", "gleam", "odin",
    "solidity", "vyper", "objective-c", "elm", "purescript", "abap", "apex",
    "hcl", "jinja", "hcl",

    # Frameworks & libraries
    "react", "angular", "vue.js", "vue", "next.js", "nextjs", "nuxt.js", "nuxtjs",
    "svelte", "sveltekit", "jquery", "redux", "mobx", "ember", "backbone",
    "astro", "remix", "solidjs", "qwik", "htmx", "hono",
    "django", "flask", "fastapi", "uvicorn", "gunicorn", "celery", "tornado",
    "spring", "spring boot", "hibernate", "struts", "quarkus", "micronaut",
    "play framework", "vert.x", "dropwizard", "jakarta ee",
    "asp.net", "asp.net core", "blazor", "entity framework", "entity framework core",
    ".net", ".net core", ".net 5", ".net 6", ".net 7", ".net 8", ".net maui",
    "laravel", "symfony", "codeigniter", "cakephp", "yii", "phalcon", "lumen",
    "ruby on rails", "sinatra", "hanami",
    "express", "express.js", "nestjs", "fastify", "koa", "hapi", "adonisjs",
    "gin", "echo", "fiber", "beego", "chi", "actix", "rocket", "axum",
    "phoenix", "ktor", "javalin", "vapor",
    "flutter", "react native", "ionic", "xamarin", "capacitor", "nativescript",
    "electron", "tauri",
    "tailwind", "tailwindcss", "bootstrap", "sass", "scss", "less",
    "material ui", "ant design", "chakra ui", "shadcn/ui", "radix ui",
    "headless ui", "daisyui", "vuetify", "quasar", "primevue", "primeng",
    "bulma",
    "vite", "webpack", "esbuild", "babel", "rollup", "parcel", "turbopack", "swc",
    "sqlalchemy", "alembic",
    "prisma", "drizzle orm", "typeorm", "sequelize", "mikroorm", "knex.js",
    "graphql", "apollo", "hasura", "trpc",
    "streamlit", "gradio", "dash", "plotly",
    "scrapy", "beautiful soup",
    "zustand", "jotai", "recoil", "valtio", "pinia", "ngrx",
    "react query", "tanstack query", "tanstack router", "swr",
    "zod", "react hook form", "formik",
    "framer motion", "gsap", "three.js", "d3.js", "chart.js", "recharts",
    "socket.io", "passport.js",
    "livewire", "inertia.js",
    "payload cms", "keystonejs", "redwoodjs",
    "godot", "unity", "unreal engine",

    # Databases
    "postgresql", "postgres", "mysql", "sql server", "sqlite", "mariadb",
    "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb",
    "cosmos db", "firestore", "neo4j", "couchdb", "couchbase",
    "influxdb", "timescaledb", "supabase", "planetscale",
    "memcached", "cockroachdb", "fauna", "arangodb", "meilisearch", "typesense",
    "oracle database", "clickhouse", "surrealdb", "edgedb", "turso",
    "realm", "scylladb", "hbase", "tidb", "yugabytedb", "rethinkdb",
    "rocksdb", "leveldb", "etcd", "minio",
    "firebase realtime database", "mongodb atlas",

    # Cloud & infrastructure
    "aws", "azure", "gcp", "google cloud",
    "aws lambda", "aws ec2", "aws s3", "aws rds", "aws cloudfront",
    "azure functions", "azure devops",
    "google cloud run", "google app engine",
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci", "travis ci",
    "argocd", "prometheus", "grafana", "datadog", "new relic",
    "cloudflare", "cloudflare workers", "cloudflare pages",
    "vercel", "netlify", "heroku", "digitalocean",
    "pulumi", "cdk", "cloudformation", "opentofu", "vault", "consul",
    "railway", "render", "fly.io",
    "minikube", "k3s", "rancher", "knative",
    "nomad", "crossplane", "packer",

    # DevOps & tools
    "git", "github", "gitlab", "bitbucket",
    "nginx", "apache", "traefik", "haproxy", "caddy",
    "kong", "envoy", "linkerd",
    "postman", "insomnia", "jira", "confluence", "notion", "figma",
    "podman", "lxc", "vagrant",
    "eslint", "prettier", "ruff", "mypy", "pyright", "biome",
    "sentry", "splunk", "kibana", "logstash", "opentelemetry",
    "sonarqube", "snyk", "semgrep",
    "turborepo", "nx", "lerna",
    "bun", "deno",

    # Testing
    "jest", "mocha", "chai", "cypress", "playwright", "selenium",
    "junit", "testng", "xunit", "nunit", "mstest",
    "pytest", "unittest", "robot framework",
    "k6", "locust", "gatling", "jmeter",
    "vitest", "jasmine", "ava", "tape",
    "rspec", "minitest", "phpunit",
    "puppeteer", "supertest", "msw", "artillery",

    # Data & ML
    "numpy", "pandas", "scipy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "matplotlib", "seaborn", "jupyter", "spark", "hadoop", "airflow", "dbt",
    "power bi", "tableau", "looker",
    "duckdb", "polars", "dask", "ray",
    "mlflow", "weights & biases", "wandb", "kubeflow", "seldon",
    "apache flink", "prefect", "dagster",
    "openai", "anthropic", "langchain", "transformers", "hugging face",
    "llamaindex", "haystack", "langflow", "vllm", "semantic kernel",
    "crewai", "langgraph", "chainlit",

    # AI / LLM
    "nlp", "natural language processing", "computer vision",
    "llm", "large language models", "gen ai", "generative ai",
    "chatgpt", "gpt", "gpt-4", "gpt-3",
    "gemini", "bard", "copilot", "github copilot",
    "rag", "retrieval augmented generation",
    "fine-tuning", "fine tuning", "finetuning",
    "embeddings", "vector databases", "pinecone", "weaviate", "chromadb", "chroma",
    "qdrant", "milvus", "pgvector", "vector store",
    "mcp", "model context protocol", "ai agents", "ai agent",
    "autogen", "prompt engineering", "prompting",
    "stable diffusion", "midjourney", "dall-e", "dalle",
    "whisper", "tts", "speech to text", "text to speech",
    "ollama", "llama", "llama 2", "llama 3", "mistral", "mixtral",
    "groq", "together ai", "replicate",

    # Message queues
    "rabbitmq", "kafka", "nats", "activemq", "pulsar", "redis streams",

    # APIs & protocols
    "rest", "graphql", "grpc", "websocket", "soap", "http", "https",
    "oauth", "oauth2", "jwt", "openapi", "swagger",
    "webhook", "webhooks", "sse", "server-sent events",

    # Architecture
    "microservices", "serverless", "event-driven", "cqrs", "ddd", "solid",
    "mvc", "mvvm", "mvp", "monolith", "modular monolith",
    "api gateway", "service mesh", "istio",

    # Testing & QA
    "qa", "quality assurance", "test automation", "automated testing",
    "e2e testing", "end to end testing", "integration testing",
    "unit testing", "load testing", "performance testing",
    "security testing", "penetration testing", "pentest",
    "sast", "dast", "owasp",

    # Data engineering
    "data pipeline", "data warehouse", "data lake",
    "snowflake", "bigquery", "redshift", "databricks",
    "kafka streams", "flink", "spark streaming",

    # Platforms & services
    "auth0", "okta", "clerk",
    "sanity", "contentful", "strapi", "algolia",
    "shopify", "woocommerce", "magento",
    "salesforce", "hubspot",
    "sendgrid", "mailgun", "twilio",
    "cloudinary",
    "segment", "mixpanel", "amplitude", "posthog",
    "wordpress", "drupal", "webflow",
    "appwrite", "pocketbase", "directus",
    "upstash", "neon",

    # Web3
    "web3", "blockchain", "ethereum", "solidity", "smart contracts",
    "web3.js", "ethers.js", "viem", "wagmi",

    # Productivity / Office (from O*NET hot technologies)
    "microsoft excel", "microsoft word", "microsoft powerpoint", "powerpoint",
    "microsoft outlook", "outlook", "microsoft teams", "teams",
    "microsoft sharepoint", "sharepoint", "microsoft project",
    "microsoft visio", "visio",
    "google docs", "google sheets", "google analytics", "google workspace",
    "microsoft office", "microsoft 365", "office 365",

    # Business / Enterprise tools (from O*NET hot technologies)
    "salesforce", "sap", "sap erp", "hubspot", "workday",
    "servicenow", "oracle database", "oracle peoplesoft",
    "intuit quickbooks", "tableau", "power bi",
    "slack", "zoom", "asana", "jira", "confluence",
    "google analytics", "marketo",

    # Creative / Design (from O*NET hot technologies)
    "adobe photoshop", "photoshop", "adobe illustrator", "illustrator",
    "adobe indesign", "indesign",
    "adobe after effects", "after effects", "adobe creative cloud", "creative cloud",
    "adobe xd", "adobe premiere pro", "premiere pro",
    "adobe lightroom", "lightroom",
    "figma", "sketch", "canva", "invision",

    # CAD / Engineering (from O*NET hot technologies)
    "autocad", "autodesk autocad", "revit", "autodesk revit",
    "solidworks", "dassault solidworks", "autodesk civil 3d",

    # GIS / Mapping (from O*NET hot technologies)
    "arcgis", "esri arcgis", "qgis",

    # Video / Media (from O*NET hot technologies)
    "davinci resolve", "final cut pro",

    # Security (from O*NET)
    "kali linux", "nmap", "metasploit", "burp suite", "nessus",

    # @sparring/tech-catalog additions - Languages
    "pascal", "cobol", "fortran", "ada", "lisp", "scheme", "prolog",
    "hack", "dart", "solidity", "vyper", "cairo", "move",
    "tcl", "awk", "sed", "zsh", "fish",
    "pl/sql", "t-sql", "cypher", "sparql", "graphql",

    # @sparring/tech-catalog - Frameworks
    "alpine.js", "gatsby", "remix", "astro", "solidjs", "qwik", "htmx",
    "hono", "starlette", "bottle", "cherrypy", "pyramid", "sanic",
    "turbogears", "web2py", "meteor", "sails.js", "feathersjs", "adonisjs",
    "loopback", "gorilla", "fiber", "chi", "actix", "rocket", "axum",
    "phoenix", "ktor", "javalin", "vapor", "kitura",
    "swiftui", "kivy", "pyqt", "gtk", "qt", "wxwidgets", "tkinter",
    "electron", "tauri", "cordova", "ionic", "nativescript",
    "capacitor", "preact", "lit", "marko", "mithril", "backbone.js",
    "ember.js", "gwt", "vaadin", "jsf",
    "django rest framework", "flask", "fastapi", "tornado",
    "spring mvc", "quarkus", "micronaut", "helidon", "play framework",
    "vert.x", "dropwizard", "spark java", "struts",
    "prisma", "drizzle orm", "typeorm", "sequelize", "mikroorm",
    "knex.js", "objection.js", "kysely", "gorm", "diesel", "seaorm",
    "ecto", "activerecord", "mybatis", "jpa", "hibernate",
    "streamlit", "gradio", "dash", "plotly", "pydantic", "sqlalchemy",
    "scrapy", "beautifulsoup",
    "godot", "unity", "unreal engine", "bevy", "phaser", "pixijs",
    "babylon.js", "cocos2d", "libgdx", "pygame", "panda3d", "monogame",
    "apache airflow", "apache beam", "apache storm", "prefect", "dagster",
    "kedro", "luigi", "metaflow", "ray", "dask", "polars", "vaex", "modin",
    "langchain", "llamaindex", "haystack", "langflow", "vllm",
    "semantic kernel", "crewai", "langgraph", "chainlit", "fastchat",
    "jax", "tensorflow", "pytorch", "keras", "scikit-learn",
    "zustand", "jotai", "recoil", "valtio", "pinia", "ngrx",
    "react query", "tanstack query", "tanstack router", "swr",
    "zod", "react hook form", "formik", "xstate", "immer",
    "framer motion", "gsap", "three.js", "d3.js", "chart.js", "recharts",
    "socket.io", "passport.js",
    "tailwind css", "material ui", "ant design", "chakra ui",
    "shadcn/ui", "radix ui", "headless ui", "daisyui", "vuetify",
    "quasar", "primevue", "primeng", "bulma", "bootstrap",
    "vite", "webpack", "esbuild", "babel", "rollup", "parcel",
    "turbopack", "swc", "turborepo", "nx", "lerna",
    "storybook", "vitest", "jest", "mocha", "cypress", "playwright",
    "selenium", "puppeteer", "supertest", "msw", "artillery",

    # @sparring/tech-catalog - Databases
    "d1", "dexie", "dgraph", "dolt", "faunadb", "gun", "h2",
    "immudb", "indexeddb", "lancedb", "lowdb", "manticore search",
    "mongodb atlas", "nedb", "orientdb", "pouchdb", "riak", "rxdb",
    "sonic", "voltdb", "watermelondb", "xata",

    # @sparring/tech-catalog - Servers
    "bun", "deno", "apache http server", "apache tomcat", "cherokee",
    "glassfish", "h2o", "iis", "jboss", "jetty", "lighttpd",
    "mongoose", "netty", "openresty", "passenger", "puma",
    "tengine", "undertow", "unicorn", "uwsgi", "wildfly",

    # @sparring/tech-catalog - Platforms
    "100ms", "agora", "airplane", "airtable", "akamai", "amazon ses",
    "aptible", "architect", "aws dynamodb", "bandwidth", "basecamp",
    "bigcommerce", "brevo", "bubble", "bunny cdn", "caprover",
    "clickup", "cloudimage", "coda", "commercejs", "convertkit",
    "convex", "coolify", "customer.io", "daily.co", "deta",
    "discord", "doppler", "elastic path", "fastly", "fathom",
    "firebase", "freshdesk", "ghost", "google cloud functions",
    "grafbase", "height", "imagekit", "imgix", "infisical",
    "intercom", "keycdn", "koyeb", "linear", "livekit",
    "mailchimp", "mailtrap", "medusa", "messagebird", "miro",
    "monday.com", "mux", "nhost", "northflank", "paypal",
    "pipedrive", "plane", "platform.sh", "plausible", "plivo",
    "postmark", "qovery", "resend", "retool", "saleor",
    "serverless framework", "sst", "stackpath", "stacktape",
    "stream", "stripe", "swell", "telnyx", "trello", "umami",
    "uploadcare", "vendure", "vercel analytics", "vonage",
    "wundergraph", "xata", "zendesk", "zeabur",

    # @sparring/tech-catalog - Tools
    "bazel", "cmake", "make", "meson", "pants",
    "black", "ruff", "mypy", "pyright", "eslint", "prettier",
    "stylelint", "oxlint", "biome",
    "sentry", "splunk", "kibana", "logstash", "opentelemetry",
    "jaeger", "zipkin", "logrocket", "plausible",
    "sonarqube", "snyk", "semgrep", "codeql", "trivy",
    "owasp zap", "grype", "osv-scanner",
    "sphinx", "docusaurus", "vitepress", "nextra", "mintlify",
    "gitpod", "github codespaces", "replit", "codesandbox", "stackblitz",
    "bruno", "hoppscotch", "httpie",
    "fastlane", "bitrise", "codemagic", "app center",
    "lighthouse", "sonarlint", "codeclimate", "deepsource", "percy",
    "chromatic", "backstopjs", "visual regression tracker",
    "dbeaver", "pgadmin", "tableplus", "robо 3t",
    "beekeeper studio", "redis insight", "mongodb compass",
    "heroku", "netlify", "vercel", "cloudflare", "digitalocean",
    "railway", "render", "fly.io", "koyeb", "coolify", "caprover",
    "northflank", "platform.sh", "zeabur",
    "git", "github", "gitlab", "bitbucket",
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci",
    "argocd", "prometheus", "grafana", "datadog",
    "pulumi", "cdk", "cloudformation", "opentofu",
    "vault", "consul", "nomad",
    "nginx", "apache", "traefik", "haproxy", "caddy",
    "kong", "envoy", "linkerd",
    "podman", "vagrant",
    "jira", "confluence", "notion", "linear", "trello", "asana",
    "clickup", "monday.com", "miro", "basecamp",
    "figma", "sketch", "canva", "invision",
    "postman", "insomnia", "bruno", "hoppscotch",
    "stripe", "paypal", "twilio", "sendgrid",
    "auth0", "okta", "clerk",
    "algolia", "elasticsearch", "meilisearch", "typesense",
    "pinecone", "weaviate", "chromadb", "qdrant", "milvus",
    "upstash", "neon", "supabase", "firebase",
    "strapi", "contentful", "sanity", "directus",
    "shopify", "woocommerce", "magento", "medusa", "saleor",
    "wordpress", "drupal", "ghost", "webflow",
    "salesforce", "hubspot", "zendesk", "freshdesk", "intercom",
    "segment", "mixpanel", "amplitude", "posthog",
    "cloudinary", "mux", "livekit",
    "openai", "anthropic", "langchain", "llamaindex", "hugging face",
    "crewai", "langgraph", "autogen", "semantic kernel",
    "ollama", "groq", "together ai", "replicate",

    # Misc
    "linux", "ubuntu", "alpine", "macos", "windows",
    "expo router", "nativewind", "react navigation",
}

SPANISH_TECH_MAP = {
    "desarrollador": None,
    "programador": None,
    "analista": None,
    "ingeniero": None,
    "arquitecto": None,
    "líder técnico": None,
    "tech lead": None,
    "base de datos": "Database",
    "nube": "Cloud",
    "servidor": "Server",
    "aplicación": "Application",
    "web": "Web",
    "móvil": "Mobile",
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
        self._skill_pattern = self._build_skill_pattern()

    @staticmethod
    def _build_skill_pattern() -> re.Pattern:
        def word_bound(s: str) -> str:
            escaped = re.escape(s)
            if s and s[-1].isalnum():
                return escaped + r'\b'
            return escaped + r'(?=\s|/|,|\.|$|[^a-zA-Z0-9])'
        parts = sorted(_TECH_SKILLS, key=len, reverse=True)
        return re.compile(
            r'\b(?:' + '|'.join(word_bound(s) for s in parts) + r')',
            re.IGNORECASE,
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
