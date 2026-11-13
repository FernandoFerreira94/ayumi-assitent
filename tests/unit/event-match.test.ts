import { describe, expect, it } from "vitest";
import { guessAppointment } from "@/features/calendar-feed/match";

const clients = [
  { id: "c1", name: "Maria Souza" },
  { id: "c2", name: "Mariana Lima" },
  { id: "c3", name: "Ana Paula Reis" },
  { id: "c4", name: "Ana Costa" },
  { id: "c5", name: "Júlia" },
];
const services = [
  { id: "s1", name: "Corte" },
  { id: "s2", name: "Corte e escova" },
  { id: "s3", name: "Unha" },
];

describe("guessAppointment", () => {
  it("primeiro nome único + serviço, sem acento nem caixa", () => {
    expect(guessAppointment("JULIA - unha", clients, services)).toMatchObject({
      clientId: "c5",
      serviceIds: ["s3"],
    });
  });
  it("palavra inteira: Maria não casa com Mariana", () => {
    expect(guessAppointment("Mariana corte", clients, services)?.clientId).toBe("c2");
    expect(guessAppointment("Maria corte", clients, services)?.clientId).toBe("c1");
  });
  it("primeiro nome repetido (Ana) só casa com sobrenome", () => {
    expect(guessAppointment("Ana - corte", clients, services)).toBeNull();
    expect(guessAppointment("Ana Costa - corte", clients, services)?.clientId).toBe("c4");
    expect(guessAppointment("ana paula unha", clients, services)?.clientId).toBe("c3");
  });
  it("serviço mais longo primeiro e vários serviços", () => {
    expect(guessAppointment("Maria Souza corte e escova + unha", clients, services)?.serviceIds).toEqual(["s2", "s3"]);
  });
  it("sem cliente = outro evento", () => {
    expect(guessAppointment("Dentista", clients, services)).toBeNull();
    expect(guessAppointment("Corte", clients, services)).toBeNull();
    expect(guessAppointment("", clients, services)).toBeNull();
  });
});
