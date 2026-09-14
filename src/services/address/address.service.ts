import { DeliveryAreaService } from "#services/delivery-area/delivery-area.service.js";
import { AddressRepository } from "./address.repository";

export class AddressService {

    constructor(
        private repository = new AddressRepository(),
        private deliveryAreaService = new DeliveryAreaService()
    ) { }

    async createAddress(
        userId: string,
        dto: CreateAddressDto
    ) {
        const deliveryArea =
            await this.deliveryAreaService.matchAddress(dto);

        if (!deliveryArea) {

            throw new Error(
                "We don't currently deliver to this location."
            );

        }

        return this.repository.create({

            userId,

            deliveryAreaId: deliveryArea.id,

        });
    }

}