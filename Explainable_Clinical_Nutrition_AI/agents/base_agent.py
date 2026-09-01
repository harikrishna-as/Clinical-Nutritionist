"""
Multi-Agent System - Base Agent class and Agent Orchestrator
Each agent analyzes specific aspects of patient data
"""
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from collections import defaultdict


class BaseAgent(ABC):
    """Base class for all clinical nutrition AI agents"""

    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.analysis_log = []

    @abstractmethod
    def analyze(self, patient_data, knowledge_graph=None):
        pass

    def log(self, message):
        self.analysis_log.append({"agent": self.name, "message": message})

    def get_log(self):
        return self.analysis_log


class AgentOrchestrator:
    """Coordinates multiple agents to produce comprehensive nutrition recommendations"""

    def __init__(self):
        self.agents = {}
        self.agent_results = {}
        self.consensus_recommendations = []

    def register_agent(self, agent):
        self.agents[agent.name] = agent
        print(f"  Registered agent: {agent.name}")

    def run_all_agents(self, patient_data, knowledge_graph=None):
        print("\n[Orchestrator] Running all agents...")
        for name, agent in self.agents.items():
            print(f"  Running {name}...")
            try:
                result = agent.analyze(patient_data, knowledge_graph)
                self.agent_results[name] = result
                print(f"    {name} completed: {len(result) if isinstance(result, dict) else 'OK'}")
            except Exception as e:
                print(f"    {name} error: {e}")
                self.agent_results[name] = {"error": str(e)}

        self._build_consensus()
        return self.agent_results

    def _build_consensus(self):
        print("\n[Orchestrator] Building consensus recommendations...")
        all_foods = defaultdict(float)
        all_avoid = set()
        all_reasons = []

        for name, result in self.agent_results.items():
            if isinstance(result, dict):
                for food in result.get("recommended_foods", []):
                    fname = food.get("name", "") if isinstance(food, dict) else str(food)
                    score = food.get("score", 0.5) if isinstance(food, dict) else 0.5
                    all_foods[fname] += score

                for food in result.get("avoid_foods", []):
                    fname = food.get("name", "") if isinstance(food, dict) else str(food)
                    all_avoid.add(fname)

                if "reasoning" in result:
                    all_reasons.append(f"{name}: {result['reasoning']}")

        sorted_foods = sorted(all_foods.items(), key=lambda x: x[1], reverse=True)
        self.consensus_recommendations = {
            "recommended_foods": sorted_foods[:15],
            "foods_to_avoid": list(all_avoid),
            "reasoning_chain": all_reasons,
            "agent_contributions": {name: list(result.keys()) if isinstance(result, dict) else []
                                   for name, result in self.agent_results.items()}
        }
        print(f"  Consensus: {len(sorted_foods)} foods recommended, {len(all_avoid)} to avoid")

    def get_recommendations(self):
        return self.consensus_recommendations

    def get_agent_summary(self):
        summary = {}
        for name, result in self.agent_results.items():
            if isinstance(result, dict):
                summary[name] = {
                    "keys": list(result.keys()),
                    "status": "error" if "error" in result else "success"
                }
            else:
                summary[name] = {"status": "success"}
        return summary
