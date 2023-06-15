import Monument from "@/models/monument";
import Image from "@/models/image";
import MonumentTypesItem from "@/models/monumentTypesItem";
import Review from "@/models/review";
import {Op, QueryTypes} from "sequelize";
import ExternalReview from "@/models/ExternalReview";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth]";
import User from "@/models/user";
import db from "@/utils/config/dbConnection";

export async function getMonuments(req, res) {
	const { wilaya, types, q = "" } = req.query;

	try {
		let monumentsOfType;
		if (types) {
			monumentsOfType = (
				await MonumentTypesItem.findAll({
					where: { type: types.toString().split(",") },
				})
			).map((item) => item.monument_id);
			console.log(monumentsOfType);
		}
		const monuments = await Monument.findAll({
			where: {
				...(wilaya && { wilaya_name: wilaya }),
				...(monumentsOfType && { id: monumentsOfType }),
				title: { [Op.like]: `%${q}%` },
			},
			attributes: { exclude: ["summary", "rating"] },
		});
		res.status(200).send({ monuments });
	} catch (err) {
		res.status(500).json(err);
	}
}

export async function getMonument(req, res) {
	const { id } = req.query;
	try {
		const monument = await Monument.findByPk(id, {
			attributes: [
				["wilaya_name", "wilaya"],
				"summary",
				"rating",
				"id",
				"title",
			],
		});
		if (!monument) {
			return res.status(404).json({ message: "monument not found" });
		}
		monument.dataValues.images = (
			await Image.findAll({
				where: { monumentId: id },
			})
		).map((image) => image.url);
		const usersReviews = await db.query(`
		select t1.id,comment,name as sender,image as sender_image from reviews as t1  join users as t2 on t1.userId=t2.id where monumentId=${id}
		`,{type:QueryTypes.SELECT});
		const externalReviews = await ExternalReview.findAll({
			where: { monumentId: id },
			attributes:{exclude:["monumentId"]}
		});
		monument.dataValues.reviews = Array.of(
			...usersReviews,
			...externalReviews
		);
		monument.dataValues.type = (
			await MonumentTypesItem.findOne({
				where: { monument_id: monument.id },
				attributes: ["type"],
			})
		).type;
		res.status(200).send({ monument: monument.dataValues });
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
}

export async function getMonumentReviews(req, res) {
	const { id, page = 0, page_size = 10 } = req.query;
	try {
		const monument = await Monument.findByPk(id);
		if (!monument) {
			return res.status(404).json({ message: "monument not found" });
		}
		const usersReviews = await Review.findAll({
			where: { monumentId: id },
		});
		const externalReviews = await ExternalReview.findAll({
			where: { monumentId: id },
		});
		const reviews = Array.of(...usersReviews, ...externalReviews);
		res.status(200).send({ reviews });
	} catch (err) {
		res.status(500).json(err);
	}
}
export async function createMonumentReview(req, res) {
	const { id } = req.query;
	const { comment } = req.body;
	const session = await getServerSession (req,res,authOptions);
	if (!session){
		return res.status(401).json({message:"unauthorized"});
	}
	const user = await User.findOne({where:{email:session.user.email}});
	try {
		const monument = await Monument.findByPk(id);
		if (!monument) {
			return res.status(404).json({ message: "monument not found" });
		}
		const review = await Review.create({
			userId: user.id,
			monumentId: id,
			comment,
		});
		res.status(200).send({ review });
	} catch (err) {
		res.status(500).json(err);
	}
}
