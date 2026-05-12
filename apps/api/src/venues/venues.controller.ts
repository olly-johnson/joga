import { Controller, Get } from "@nestjs/common";
import { VenuesService } from "./venues.service.js";

@Controller("venues")
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll() {
    return this.venuesService.findAll();
  }
}
