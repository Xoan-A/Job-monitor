from __future__ import annotations

from typing import Dict, List, Optional, Tuple


_DEFAULT_RELATIONSHIPS: Dict[str, List[Tuple[str, float]]] = {
    # Frameworks → language/platform
    "ASP.NET Core": [(".NET", 0.85), ("ASP.NET", 0.80), ("C#", 0.70)],
    "ASP.NET": [(".NET", 0.85), ("C#", 0.70)],
    "Entity Framework Core": [(".NET", 0.60), ("SQL", 0.50)],
    "Entity Framework": [(".NET", 0.60), ("SQL", 0.50)],
    "Blazor": [(".NET", 0.60), ("C#", 0.55), ("JavaScript", 0.30)],
    "Django": [("Python", 0.70), ("SQL", 0.40)],
    "Flask": [("Python", 0.65)],
    "FastAPI": [("Python", 0.70), ("REST", 0.50)],
    "Spring Boot": [("Java", 0.75), ("SQL", 0.40)],
    "Spring": [("Java", 0.70)],
    "Laravel": [("PHP", 0.70), ("SQL", 0.40)],
    "Ruby on Rails": [("Ruby", 0.75), ("SQL", 0.40)],
    "React": [("JavaScript", 0.60), ("TypeScript", 0.50), ("HTML", 0.30), ("CSS", 0.30)],
    "Angular": [("TypeScript", 0.65), ("JavaScript", 0.50), ("HTML", 0.30), ("CSS", 0.30)],
    "Vue.js": [("JavaScript", 0.60), ("TypeScript", 0.45), ("HTML", 0.30), ("CSS", 0.30)],
    "Next.js": [("React", 0.70), ("JavaScript", 0.55), ("TypeScript", 0.50)],
    "Nuxt.js": [("Vue.js", 0.70), ("JavaScript", 0.55)],
    "React Native": [("React", 0.65), ("JavaScript", 0.60)],
    "Flutter": [("Dart", 0.75)],
    "SwiftUI": [("Swift", 0.75)],

    # Databases → SQL/NoSQL family
    "PostgreSQL": [("SQL", 0.60), ("Relational Databases", 0.55)],
    "MySQL": [("SQL", 0.60), ("Relational Databases", 0.55)],
    "SQL Server": [("SQL", 0.65), ("Relational Databases", 0.55), (".NET", 0.30)],
    "SQLite": [("SQL", 0.55), ("Relational Databases", 0.45)],
    "MariaDB": [("MySQL", 0.70), ("SQL", 0.55)],
    "MongoDB": [("NoSQL", 0.60), ("JSON", 0.30)],
    "Redis": [("Caching", 0.55), ("NoSQL", 0.40)],
    "Elasticsearch": [("Search", 0.60), ("NoSQL", 0.40)],
    "DynamoDB": [("NoSQL", 0.55), ("AWS", 0.40)],
    "Cosmos DB": [("NoSQL", 0.50), ("Azure", 0.40)],
    "Firestore": [("NoSQL", 0.50), ("GCP", 0.40)],
    "Supabase": [("PostgreSQL", 0.60), ("SQL", 0.40)],
    "PlanetScale": [("MySQL", 0.55), ("SQL", 0.40)],

    # DevOps tools → categories
    "Docker": [("Containers", 0.65), ("DevOps", 0.40)],
    "Kubernetes": [("Containers", 0.60), ("DevOps", 0.50), ("Docker", 0.40)],
    "Helm": [("Kubernetes", 0.55), ("DevOps", 0.35)],
    "Terraform": [("IaC", 0.60), ("DevOps", 0.50)],
    "Ansible": [("IaC", 0.55), ("DevOps", 0.50)],
    "Jenkins": [("CI/CD", 0.60), ("DevOps", 0.50)],
    "GitHub Actions": [("CI/CD", 0.60), ("Git", 0.40)],
    "GitLab CI": [("CI/CD", 0.60), ("Git", 0.40)],
    "ArgoCD": [("CI/CD", 0.55), ("Kubernetes", 0.45)],

    # Cloud → provider
    "AWS EC2": [("AWS", 0.70), ("Cloud", 0.40)],
    "AWS S3": [("AWS", 0.70), ("Cloud", 0.40)],
    "AWS Lambda": [("AWS", 0.65), ("Serverless", 0.55), ("Cloud", 0.40)],
    "Azure": [("Cloud", 0.60)],
    "GCP": [("Cloud", 0.60)],
    "Heroku": [("PaaS", 0.50), ("Cloud", 0.40)],
    "Vercel": [("PaaS", 0.45), ("Cloud", 0.35)],
    "Netlify": [("PaaS", 0.45), ("Cloud", 0.35)],
    "DigitalOcean": [("Cloud", 0.50)],

    # API patterns
    "REST API": [("REST", 0.70), ("HTTP", 0.40)],
    "GraphQL": [("API", 0.50), ("REST", 0.30)],
    "gRPC": [("API", 0.50), ("Protocol Buffers", 0.40)],
    "WebSocket": [("HTTP", 0.40)],

    # Testing frameworks → language
    "Jest": [("JavaScript", 0.50), ("Testing", 0.50)],
    "Mocha": [("JavaScript", 0.50), ("Testing", 0.50)],
    "Cypress": [("JavaScript", 0.45), ("Testing", 0.55)],
    "Playwright": [("Testing", 0.55), ("TypeScript", 0.35), ("JavaScript", 0.35)],
    "Selenium": [("Testing", 0.55)],
    "JUnit": [("Java", 0.50), ("Testing", 0.50)],
    "xUnit": [(".NET", 0.50), ("Testing", 0.50)],
    "NUnit": [(".NET", 0.50), ("Testing", 0.50)],
    "pytest": [("Python", 0.55), ("Testing", 0.50)],

    # Monitoring
    "Prometheus": [("Monitoring", 0.60)],
    "Grafana": [("Monitoring", 0.55), ("Visualization", 0.40)],
    "Datadog": [("Monitoring", 0.60)],
    "New Relic": [("Monitoring", 0.60)],

    # Data engineering
    "Apache Airflow": [("ETL", 0.55), ("Data Engineering", 0.55)],
    "Apache Spark": [("Data Engineering", 0.55), ("Big Data", 0.50)],
    "dbt": [("Data Engineering", 0.55), ("SQL", 0.45)],
    "Power BI": [("Business Intelligence", 0.60), ("Data Visualization", 0.55)],
    "Tableau": [("Business Intelligence", 0.60), ("Data Visualization", 0.55)],

    # ML/AI
    "TensorFlow": [("Machine Learning", 0.60), ("Deep Learning", 0.55)],
    "PyTorch": [("Machine Learning", 0.60), ("Deep Learning", 0.55)],
    "scikit-learn": [("Machine Learning", 0.60), ("Python", 0.40)],
    "Keras": [("Deep Learning", 0.55), ("Machine Learning", 0.45)],

    # Frontend tools
    "Tailwind CSS": [("CSS", 0.55)],
    "Sass": [("CSS", 0.55)],
    "SCSS": [("CSS", 0.55)],
    "Bootstrap": [("CSS", 0.50), ("HTML", 0.35)],
    "Material UI": [("React", 0.45), ("CSS", 0.35)],
    "Styled Components": [("React", 0.45), ("CSS", 0.40)],
    "Webpack": [("JavaScript", 0.45), ("Build Tools", 0.50)],
    "Vite": [("JavaScript", 0.45), ("Build Tools", 0.50)],

    # Message queues
    "RabbitMQ": [("Message Queue", 0.60)],
    "Kafka": [("Message Queue", 0.55), ("Event Streaming", 0.55)],
    "NATS": [("Message Queue", 0.50)],
}


class SkillRelationships:
    def __init__(self, extra: Optional[Dict[str, List[Tuple[str, float]]]] = None):
        self._relationships = dict(_DEFAULT_RELATIONSHIPS)
        if extra:
            self._relationships.update(extra)
        # Build reverse index: if A relates to B, then B also relates to A
        self._reverse: Dict[str, List[Tuple[str, float]]] = {}
        for skill, related_list in self._relationships.items():
            for related_skill, confidence in related_list:
                self._reverse.setdefault(related_skill, []).append((skill, confidence))

    def get_related(self, skill: str) -> List[Tuple[str, float]]:
        direct = self._relationships.get(skill, [])
        reverse = self._reverse.get(skill, [])
        seen = {s for s, _ in direct}
        combined = list(direct)
        for s, c in reverse:
            if s not in seen:
                combined.append((s, c))
        return combined

    def get_all_related(self, skills: List[str]) -> Dict[str, List[Tuple[str, float]]]:
        result = {}
        for skill in skills:
            related = self.get_related(skill)
            if related:
                result[skill] = related
        return result


_relationships: Optional[SkillRelationships] = None


def get_relationships(extra: Optional[Dict[str, List[Tuple[str, float]]]] = None) -> SkillRelationships:
    global _relationships
    if _relationships is None:
        _relationships = SkillRelationships(extra)
    return _relationships
