import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import {
  AgentsService,
  CreateAgentDto,
  UpdateAgentDto,
} from "./agents.service";
import { JwtAuthGuard } from "../common/guards/jwt.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private agents: AgentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  findAll() {
    return this.agents.findAll();
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER", "REFERRAL_AGENT")
  findOne(@Param("id") id: string, @CurrentUser() user: any) {
    if (user.role === "REFERRAL_AGENT" && user.profileId !== id)
      throw new ForbiddenException("Access denied");
    return this.agents.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN")
  create(@Body() dto: CreateAgentDto) {
    return this.agents.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN")
  update(@Param("id") id: string, @Body() dto: UpdateAgentDto) {
    return this.agents.update(id, dto);
  }

  @Get(":id/commission-summary")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER", "REFERRAL_AGENT")
  commissionSummary(@Param("id") id: string, @CurrentUser() user: any) {
    if (user.role === "REFERRAL_AGENT" && user.profileId !== id)
      throw new ForbiddenException("Access denied");
    return this.agents.getCommissionSummary(id);
  }

  @Patch("commissions/:commissionId/release")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN")
  releaseCommission(@Param("commissionId") id: string) {
    return this.agents.releaseCommission(id);
  }

  // GET /api/agents/:id/commission-statement  download PDF statement
  @Get(":id/commission-statement")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER", "REFERRAL_AGENT")
  async commissionStatement(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    if (user.role === "REFERRAL_AGENT" && user.profileId !== id)
      throw new ForbiddenException("Access denied");
    const pdf = await this.agents.generateCommissionStatement(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="commission-statement-${id}.pdf"`,
    );
    res.send(pdf);
  }
}
