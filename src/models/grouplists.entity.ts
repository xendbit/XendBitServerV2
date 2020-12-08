import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "XB_GL"})
export class Grouplists {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    value: string;
    @Column()
    gl_id: number;
}
