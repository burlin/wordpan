from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from src.crews.base.llm import DEFAULT_LLM
from src.crews.word_pair_enrichment_crew.schemas import WordPairEnrichmentOutput


@CrewBase
class WordPairEnrichmentCrew():
    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def enrichment_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['enrichment_agent'],
            llm=DEFAULT_LLM
        )

    @task
    def enrichment_task(self) -> Task:
        return Task(
            config=self.tasks_config['enrichment_task'],
            output_pydantic=WordPairEnrichmentOutput
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential
        )
