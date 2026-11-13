import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { assertTestDatabase } from "./db-guard";

// Antes de qualquer teste: nunca rodar contra um banco que não seja o local de teste
assertTestDatabase();

afterEach(() => cleanup());
